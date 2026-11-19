(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaekilCampaignCore = factory();
})(typeof window === 'object' ? window : this, () => {
  function campaignFromUrl(url) {
    const params = new URL(url).searchParams;
    const name = (params.get('utm_campaign') || '').trim().normalize('NFC');
    if (/^[가-힣a-zA-Z][가-힣a-zA-Z0-9 _-]{0,63}$/.test(name)) return name;
    const naver = params.get('n_campaign') || '';
    if (/^cmp-[a-z][0-9]{3}-[0-9]{2}-[0-9]{6,20}$/i.test(naver)) return naver;
    return '';
  }
  return { campaignFromUrl };
});
