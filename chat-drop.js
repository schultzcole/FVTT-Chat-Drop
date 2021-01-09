Hooks.on("init", () => {
    // Override default options for ChatLog
    const defaultOptionsDescriptor = Object.getOwnPropertyDescriptor(ChatLog, "defaultOptions");
    const old_defaultOptions = defaultOptionsDescriptor.get;
    defaultOptionsDescriptor.get = function () {
        const defaults = old_defaultOptions();
        defaults.dragDrop = [{ dragSelector: ".item-list .item", dropSelector: "#chat-message" }];
        return defaults;
    };
    Object.defineProperty(ChatLog, "defaultOptions", defaultOptionsDescriptor);

    // Activate drag drop listeners
    const old_activateListeners = ChatLog.prototype.activateListeners;
    ChatLog.prototype.activateListeners = function (html) {
        old_activateListeners.apply(this, arguments);
        this._dragDrop.forEach((d) => d.bind(html[0]));
    };

    // Define what happens on drop
    ChatLog.prototype._onDrop = async function (event) {
        event.preventDefault();

        // Get the link from the drop data
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
        if (!data) return;
        const link = await createLink(data);
        if (!link) return;

        // Insert the link in place of the currently selected text
        const chatBox = this.element.find("#chat-message");
        let chatBoxEl = chatBox[0];
        const { selectionStart, selectionEnd } = chatBoxEl;
        const existingText = chatBox.val();
        const preText = existingText.slice(0, selectionStart);
        const postText = existingText.slice(selectionEnd);
        chatBox.val(`${preText}${link}${postText}`);

        // Set the cursor location to the end of the newly inserted link
        chatBox.focus();
        const newCaretPosition = selectionStart + link.length;
        chatBoxEl.setSelectionRange(newCaretPosition, newCaretPosition);
    };
});

async function createLink(data) {
    // Case 1 - Entity from Compendium Pack
    if (data.pack) {
        const pack = game.packs.get(data.pack);
        if (!pack) return;
        const entity = await pack.getEntity(data.id);
        return `@Compendium[${data.pack}.${data.id}]{${entity.name}}`;
    }
    // Case 2 - Entity from World
    else {
        const config = CONFIG[data.type];
        if (!config) return;
        const entity = config.collection.instance.get(data.id);
        if (!entity) return;
        return `@${data.type}[${entity._id}]{${entity.name}}`;
    }
}
