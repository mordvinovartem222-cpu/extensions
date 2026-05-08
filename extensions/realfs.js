// Name: Настоящая ФС
// ID: realfs
// Description: Позволяет создавать, удалять и изменять файлы и папки прямо на твоем компьютере.
// By: ArtemMordvinov <https://github.com/mordvinovartem222-cpu/>
// License: MIT

(function (Scratch) {
    'use strict';

    class RealFS {
        constructor() {
            this.rootHandle = null;
            this.currentHandle = null;
            this.pathStack = []; // Храним историю папок для "Выхода"
        }

        getInfo() {
            return {
                id: 'realfs',
                name: 'Настоящая ФС (Full)',
                color1: '#0055ff',
                blocks: [
                    { opcode: 'setFolder', blockType: Scratch.BlockType.COMMAND, text: '📁 ВЫБРАТЬ ГЛАВНУЮ ПАПКУ' },
                    { opcode: 'getStack', blockType: Scratch.BlockType.REPORTER, text: '📍 Путь: [root]/[PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
                    '---',
                    { opcode: 'createFile', blockType: Scratch.BlockType.COMMAND, text: '📄 Создать файл [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'file.txt' } } },
                    { opcode: 'writeFile', blockType: Scratch.BlockType.COMMAND, text: '📝 Задать в [NAME] значение [TEXT]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'file.txt' }, TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: '123' } } },
                    { opcode: 'readFile', blockType: Scratch.BlockType.REPORTER, text: '📖 Открыть (считать) [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'file.txt' } } },
                    { opcode: 'deleteFile', blockType: Scratch.BlockType.COMMAND, text: '🗑️ Удалить файл [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'file.txt' } } },
                    { opcode: 'renameFile', blockType: Scratch.BlockType.COMMAND, text: '✏️ Переименовать файл [OLD] в [NEW]', arguments: { OLD: { type: Scratch.ArgumentType.STRING, defaultValue: 'file.txt' }, NEW: { type: Scratch.ArgumentType.STRING, defaultValue: 'file2.txt' } } },
                    '---',
                    { opcode: 'createFolder', blockType: Scratch.BlockType.COMMAND, text: '📂 Создать папку [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'folder' } } },
                    { opcode: 'deleteFolder', blockType: Scratch.BlockType.COMMAND, text: '🔥 Удалить папку [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'folder' } } },
                    { opcode: 'renameFolder', blockType: Scratch.BlockType.COMMAND, text: '🔄 Переименовать папку [OLD] в [NEW]', arguments: { OLD: { type: Scratch.ArgumentType.STRING, defaultValue: 'old_folder' }, NEW: { type: Scratch.ArgumentType.STRING, defaultValue: 'new_folder' } } },
                    { opcode: 'enterFolder', blockType: Scratch.BlockType.COMMAND, text: '➡️ Перейти в папку [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'folder' } } },
                    { opcode: 'exitFolder', blockType: Scratch.BlockType.COMMAND, text: '⬅️ Выйти из папки' },
                    '---',
                    { opcode: 'scanFolder', blockType: Scratch.BlockType.REPORTER, text: '📋 Список файлов/папок (JSON)' }
                ]
            };
        }

        async setFolder() {
            try {
                this.rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                this.currentHandle = this.rootHandle;
                this.pathStack = [];
                alert("Корневая папка выбрана!");
            } catch (e) { alert("Ошибка выбора."); }
        }

        getStack() { return this.pathStack.join('/'); }

        async createFile({ NAME }) { if (!this.currentHandle) return; await this.currentHandle.getFileHandle(NAME, { create: true }); }

        async writeFile({ NAME, TEXT }) {
            if (!this.currentHandle) return;
            const h = await this.currentHandle.getFileHandle(NAME, { create: true });
            const w = await h.createWritable();
            await w.write(TEXT); await w.close();
        }

        async readFile({ NAME }) {
            if (!this.currentHandle) return "";
            try {
                const h = await this.currentHandle.getFileHandle(NAME);
                const f = await h.getFile(); return await f.text();
            } catch (e) { return "Ошибка чтения"; }
        }

        async deleteFile({ NAME }) { if (this.currentHandle) await this.currentHandle.removeEntry(NAME); }

        async renameFile({ OLD, NEW }) {
            if (!this.currentHandle) return;
            const h = await this.currentHandle.getFileHandle(OLD);
            await h.move(NEW);
        }

        async createFolder({ NAME }) { if (this.currentHandle) await this.currentHandle.getDirectoryHandle(NAME, { create: true }); }

        async deleteFolder({ NAME }) { if (this.currentHandle) await this.currentHandle.removeEntry(NAME, { recursive: true }); }

        async renameFolder({ OLD, NEW }) {
            if (!this.currentHandle) return;
            const h = await this.currentHandle.getDirectoryHandle(OLD);
            await h.move(NEW);
        }

        async enterFolder({ NAME }) {
            if (!this.currentHandle) return;
            try {
                const next = await this.currentHandle.getDirectoryHandle(NAME);
                this.pathStack.push(this.currentHandle); // Сохраняем текущую, чтобы вернуться
                this.currentHandle = next;
            } catch (e) { alert("Папка не найдена"); }
        }

        exitFolder() {
            if (this.pathStack.length > 0) {
                this.currentHandle = this.pathStack.pop();
            } else {
                alert("Вы уже в корне!");
            }
        }

        async scanFolder() {
            if (!this.currentHandle) return "{}";
            const getTree = async (h) => {
                const t = {};
                for await (const [n, e] of h.entries()) {
                    t[n] = (e.kind === 'directory') ? await getTree(e) : "file";
                }
                return t;
            };
            return JSON.stringify(await getTree(this.currentHandle), null, 2);
        }
    }


    Scratch.extensions.register(new RealFS());
})(Scratch);
