document.addEventListener("click", function (event) {
    var clickedElement = {
        tag: event.target.tagName,
        class: event.target.className,
        id: event.target.id,
        text: event.target.textContent,
        src: event.target.src
    };

    (async () => {
        const response = await chrome.runtime.sendMessage({action: "sendClickedElement", clickedElement: clickedElement});
        console.log(response);
    })();
});
