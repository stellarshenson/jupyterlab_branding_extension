import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_custom_main_logo_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_custom_main_logo_extension:plugin',
  description: 'Jupyterlab extension to use custom logo for the jupyterlab main logo',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab_custom_main_logo_extension is activated!');
  }
};

export default plugin;
