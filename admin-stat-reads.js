/* One-shot, authenticated Firestore reads for the reporting dashboard. */
(function () {
  'use strict';
  const orderFields = ['createdAt','createdAtMs','paidAt','paidAtMs','pay_date','isTest','status',
    'pay_state','lastPayState','refundedAmount','cancelledAtMs','entitlementRevokedAtMs',
    'amount','product','entitlementReviewRequired'];
  const failure = code => Object.assign(new Error(code), {code});
  function decode(value) {
    if ('integerValue' in value) return Number(value.integerValue);
    if ('mapValue' in value) return fields(value.mapValue.fields);
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
    return Object.values(value)[0];
  }
  function fields(values) {
    return Object.fromEntries(Object.entries(values || {}).map(([key, value]) => [key, decode(value)]));
  }
  function filter(fieldPath, op, value) {
    return {fieldFilter:{field:{fieldPath}, op, value}};
  }
  function create(project, user, signal) {
    const parent = 'projects/' + project + '/databases/(default)/documents';
    const endpoint = 'https://firestore.googleapis.com/v1/' + parent + ':runQuery';
    async function read(collectionId, options) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const cancel = () => controller.abort();
        if (signal.aborted) throw failure('cancelled');
        signal.addEventListener('abort', cancel, {once:true});
        const timer = setTimeout(cancel, 10500);
        try {
          const token = await user.getIdToken();
          const response = await fetch(endpoint, {
            method:'POST', cache:'no-store', signal:controller.signal,
            headers:{Authorization:'Bearer ' + token, 'Content-Type':'application/json'},
            body:JSON.stringify({structuredQuery:{from:[{collectionId}], ...options}})
          });
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) throw failure('permission-denied');
            if (response.status === 429 || response.status >= 500) throw failure('unavailable');
            throw failure('failed-precondition');
          }
          const rows = await response.json();
          if (!Array.isArray(rows) || rows.some(row => row.error)) throw failure('invalid-response');
          return {docs:rows.filter(row => row.document).map(({document}) => ({
            id:document.name.split('/').pop(), data:() => fields(document.fields)
          }))};
        } catch (error) {
          if (signal.aborted) throw failure('cancelled');
          const transient = error instanceof TypeError || error.name === 'AbortError' ||
            ['unavailable','auth/network-request-failed'].includes(error.code);
          if (!transient) throw error;
          if (attempt) throw failure('unavailable');
        } finally {
          clearTimeout(timer);
          signal.removeEventListener('abort', cancel);
        }
      }
    }
    function daily(collection, start, end) {
      const campaign = collection === 'dailyCampaignVisits';
      const field = campaign ? 'date' : '__name__';
      const value = day => campaign ? {stringValue:day} : {referenceValue:parent + '/' + collection + '/' + day};
      return read(collection, {where:{compositeFilter:{op:'AND', filters:[
        filter(field, 'GREATER_THAN_OR_EQUAL', value(start)), filter(field, 'LESS_THAN_OR_EQUAL', value(end))
      ]}}});
    }
    async function orders(first) {
      const limit = 1000;
      const snapshots = await Promise.all(['createdAt','createdAtMs','paidAtMs'].map(fieldPath => {
        const options = {select:{fields:orderFields.map(fieldPath => ({fieldPath}))},
          orderBy:[{field:{fieldPath},direction:'DESCENDING'}], limit:limit + 1};
        if (fieldPath === 'paidAtMs') options.where = filter(fieldPath,'GREATER_THAN_OR_EQUAL',
          {integerValue:String(Date.parse(first + 'T00:00:00+09:00'))});
        return read('paymentOrders', options);
      }));
      return window.TaekilAnalytics.mergeOrderSnapshots(snapshots,limit);
    }
    return {daily,orders};
  }
  window.TaekilStatReads = {create};
})();
