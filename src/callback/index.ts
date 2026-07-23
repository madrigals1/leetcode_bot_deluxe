export { callback } from "./decorator";
export { CALLBACKS_TO_REGISTER } from "./registry";
export type { CallbackResponse, EditTextResponse, EditPhotoResponse } from "./response/types";
export { dispatchCallbackResponse } from "./response/dispatch";
export { editText, editPhoto } from "./response/shortcuts";
