import _ from 'lodash';

export default {
  getParameter(obj, req, settings, i18nNode){
    const param = {};
    // default parameter
    param['baseUrl'] = _.cloneDeep(settings.config.app.urlBase || '');
    param['author'] = _.cloneDeep(settings.config.app.author || '');
    param['systemName'] = _.cloneDeep(settings.config.app.name || 'MDBBS');
    param['_csrf'] = _.cloneDeep(req.session.csrfToken.id);
    param['locale'] = _.cloneDeep(settings.i18n.getLocale(req));
    param['locale_str'] = _.cloneDeep(req.__('lang.current'));
    param['locales'] = _.cloneDeep(settings.i18n.getLocales());
    param['locales_all'] = [];
    for (const locale of param['locales']) {
      let locale_str = req.__({ phrase: 'lang.current', locale: locale });
      if (!locale_str || locale_str === 'lang.current') {
        locale_str = locale;
      }
      param['locales_all'].push({
        code: locale,
        name: locale_str,
      });
    }
    // default setting
    param['title'] = _.cloneDeep(req.__('page.' + i18nNode + '.title')) + ' - ' + param['systemName']
    param['description'] = _.cloneDeep(req.__('page.' + i18nNode + '.description'));
    param['pageTitle'] = _.cloneDeep(req.__('page.' + i18nNode + '.pageTitle'));
    param['pageDescription'] = _.cloneDeep(req.__('page.' + i18nNode + '.pageDescription'));
    // user
    param['isLogin'] = req.session.user ? true : false;
    param['user_id'] = _.cloneDeep(req.session.user?.id || -1);
    param['user_loginId'] = _.cloneDeep(req.session.user?.login_id || '');
    param['user_name'] = _.cloneDeep(req.session.user?.display_name || '');
    for (const key in obj) {
      param[key] = _.cloneDeep(obj[key]);
    }
    return param;
  }
};
