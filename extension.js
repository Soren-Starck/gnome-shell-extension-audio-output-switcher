const { St, Gio, Clutter } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let outputSwitcher;

function init() {}

function enable() {
    outputSwitcher = new OutputSwitcher();
    Main.panel.addToStatusArea('output-switcher', outputSwitcher, 1);
}

function disable() {
    outputSwitcher.destroy();
}

class OutputSwitcher extends PanelMenu.Button {
    constructor() {
        super(0.0, 'Output Switcher');

        this._initMenu();
        this._initSignals();
        this._updateIcon();
    }

    _initMenu() {
        this.menu.removeAll();

        const outputs = this._getOutputs();

        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];

            const menuItem = new PopupMenu.PopupMenuItem(output.description);
            menuItem.connect('activate', () => {
                this._setActiveOutput(output);
            });
            this.menu.addMenuItem(menuItem);
        }

        const separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator);

        const refreshItem = new PopupMenu.PopupMenuItem('Refresh');
        refreshItem.connect('activate', () => {
            this._updateMenu();
        });
        this.menu.addMenuItem(refreshItem);
    }

    _initSignals() {
        this._settingsChangedId = global.settings.connect('changed::audio-output', () => {
            this._updateMenu();
        });
    }

    _getOutputs() {
        const outputs = [];

        const settings = new Gio.Settings({ schema_id: 'org.gnome.settings-daemon.plugins.media-keys' });
        const outputDevices = settings.get_strv('audio-output');

        for (let i = 0; i < outputDevices.length; i++) {
            const outputDevice = outputDevices[i];

            const output = {
                name: outputDevice.split(':')[0],
                description: outputDevice.split(':')[1]
            };

            outputs.push(output);
        }

        return outputs;
    }

    _setActiveOutput(output) {
        const settings = new Gio.Settings({ schema_id: 'org.gnome.settings-daemon.plugins.media-keys' });

        settings.set_string('active-audio-output', output.name);
    }

    _updateMenu() {
        this._initMenu();
        this._updateIcon();
    }

    _updateIcon() {
        const outputs = this._getOutputs();

        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];

            if (output.name === this._getActiveOutputName()) {
                const icon = new St.Icon({ icon_name: 'audio-volume-high-symbolic', style_class: 'system-status-icon' });
                this.actor.set_child(icon);
                return;
            }
        }

        const icon = new St.Icon({ icon_name: 'audio-volume-muted-symbolic', style_class: 'system-status-icon' });
        this.actor.set_child(icon);
    }

    _getActiveOutputName() {
        const settings = new Gio.Settings({ schema_id: 'org.gnome.settings-daemon.plugins.media-keys' });
        return settings.get_string('active-audio-output');
    }

    destroy() {
        global.settings.disconnect(this._settingsChangedId);
        super.destroy();
    }
}
