import plugin from '../index';

jest.mock('../handler', () => ({
  fetchLogoConfig: jest.fn().mockResolvedValue({
    logo_url: '',
    splash_logo_url: '',
    system_name: 'my lab',
    header_system_name_color: '#123456',
    stage: 'PRD'
  }),
  fetchLogoContent: jest.fn()
}));

describe('plugin settings', () => {
  it('should re-render the header when a setting changes', async () => {
    const spacer = document.createElement('div');
    spacer.className = 'jp-Toolbar-spacer';
    spacer.dataset.jpItemName = 'spacer';
    document.body.appendChild(spacer);

    const values: Record<string, unknown> = {
      capitalize: false,
      colorMode: 'auto',
      customColor: '',
      stageColors: true
    };
    let changed = () => {};
    const settings = {
      get: (key: string) => ({ composite: values[key] }),
      changed: { connect: (slot: () => void) => (changed = slot) }
    };
    const app = { restored: Promise.resolve() };
    const registry = { load: jest.fn().mockResolvedValue(settings) };

    await plugin.activate(app as any, registry as any);
    await app.restored;

    const name = () =>
      spacer.querySelector('.jp-Branding-systemName') as HTMLElement;
    const stage = () => spacer.querySelector('.jp-Branding-stage')!;

    expect(name().classList).not.toContain('jp-Branding-systemName-uppercase');
    expect(name().style.color).toBe('');
    expect(stage().classList).toContain('jp-Branding-stage-prd');

    // customColor blank in custom mode falls back to header_system_name_color
    Object.assign(values, {
      capitalize: true,
      colorMode: 'custom',
      stageColors: false
    });
    changed();
    expect(name().classList).toContain('jp-Branding-systemName-uppercase');
    expect(name().style.color).toBe('rgb(18, 52, 86)');
    expect(stage().classList).not.toContain('jp-Branding-stage-prd');

    values.customColor = '#ff0000';
    changed();
    expect(name().style.color).toBe('rgb(255, 0, 0)');
    expect(spacer.children.length).toBe(2);

    document.body.removeChild(spacer);
  });
});
