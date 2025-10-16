/* global define, brackets */
/* eslint no-unused-vars: "warn" */
// eslint-disable-next-line
define (function (require, exports, module) {
    const AppInit = brackets.getModule("utils/AppInit");
    const CommandManager = brackets.getModule("command/CommandManager");
    const Commands = brackets.getModule("command/Commands");
    const Menus = brackets.getModule("command/Menus");
    const EditorManager = brackets.getModule("editor/EditorManager");

    // this function traverses the whole file and gets the ranges of all the comments in the file and returns it
    function _getAllComments(editor) {
        const totalLineCount = editor.lineCount();
        let pos = { line: 0, ch: 0 };
        let token;
        const commentRanges = [];

        while (true) {
            token = editor.getNextToken(pos, false, true);

            // if token doesn't exist, there can be 2 possible cases
            // 1: its an empty line, not the end of file. in that case we need to manually move the pos to next line
            // 2: if its end of file, exit the loop
            if (!token) {
                if (pos.line >= totalLineCount - 1) { break; } // end of file
                else {
                    pos.line += 1;
                    pos.ch = 0;
                }
            } else { // token exists, check for 'comment' type tokens
                if (token.type && token.type.includes('comment')) {
                    commentRanges.push({
                        from: { line: token.line, ch: token.start },
                        to: { line: token.line, ch: token.end }
                    });
                }

                pos.line = token.line;
                pos.ch = token.end;
            }
        }

        return commentRanges;
    }

    // this function is responsible to remove the comments from the editor
    // it takes the range of all the comments as a param: commentsToRemove
    function _removeAllComments(editor, commentsToRemove) {
        if (!commentsToRemove.length) { return; }

        // first we sort it from bottom to top, so that when removing the positions doesn't get stale
        commentsToRemove.sort((a, b) => {
            if (b.from.line !== a.from.line) return b.from.line - a.from.line;
            return b.from.ch - a.from.ch;
        });

        editor.document.batchOperation(function () {
            for (const range of commentsToRemove) {
                editor.replaceRange('', range.from, range.to);
            }
        });
    }

    // this is the main driver function that gets called when the 'Remove Comments' menu button is clicked
    // it completes the comment removal in 2 steps:
    // 1st: gets the ranges of all the comments in the file (because if we remove directly when traversing, the cursor position might get stale)
    // 2nd: sorts it from bottom to top, then removes it
    function handleMenuItemClick() {
        const editor = EditorManager.getActiveEditor();
        if (!editor) { return; }

        const commentsToRemove = _getAllComments(editor);
        _removeAllComments(editor, commentsToRemove);
    }

    // this function is all about registering the command and adding the menu item
    function registerStuff() {
        const MY_COMMAND_ID = "remove_comments";
        CommandManager.register("Remove Comments", MY_COMMAND_ID, handleMenuItemClick);

        const menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
        menu.addMenuItem(MY_COMMAND_ID, '', Menus.AFTER, Commands.EDIT_BEAUTIFY_CODE_ON_SAVE);
    }

	AppInit.appReady(function () {
        setTimeout(() => {
            registerStuff();
        }, 100);
	});
});
