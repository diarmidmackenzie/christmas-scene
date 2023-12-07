// Temporary workaround for template declaration; see issue 167
NAF.schemas.getComponentsOriginal = NAF.schemas.getComponents;

NAF.schemas.getComponents = (template) => {
  if (!NAF.schemas.hasTemplate('#head-template')) {
    NAF.schemas.add({
      template: '#head-template',
      components: [
        'position',
        'rotation',
        {
          selector: '.head',
          component: 'material',
          property: 'color'
        }
      ]
    });
  }
  if (!NAF.schemas.hasTemplate('#bauble-template')) {
    NAF.schemas.add({
      template: '#bauble-template',
      components: [
        'position',
        'rotation',
        'object-parent'
      ]
    });
  }
  if (!NAF.schemas.hasTemplate('#block-template')) {
    NAF.schemas.add({
      template: '#block-template',
      components: [
        'position',
        'rotation',
        'object-parent'
      ]
    });
  }
  const components = NAF.schemas.getComponentsOriginal(template);
  return components;
};