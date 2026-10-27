// The language button opens its dialog through invoker commands (commandfor/command); where a browser has none yet,
// this does the same, so the picker works everywhere a script runs (and the <noscript> links cover the rest).
const button = document.querySelector('[commandfor="lang-dialog"]');
const dialog = document.getElementById('lang-dialog');
if (button && dialog && !('command' in HTMLButtonElement.prototype)) button.addEventListener('click', () => dialog.showModal());
