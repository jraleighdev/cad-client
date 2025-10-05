import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { Point, Line, Rectangle, Circle } from "../types/geometry";

export type ClipboardEntity = Line | Rectangle | Circle;

type AppState = {
    snapEnabled: boolean;
    orthoEnabled: boolean;
    mousePosition: Point;
    clipboardEntity: ClipboardEntity | null;
};


const initialState: AppState = {
    snapEnabled: true,
    orthoEnabled: true,
    mousePosition: {x: 0, y: 0},
    clipboardEntity: null
};

export const AppStore = signalStore(
    { providedIn: 'root'},
    withState(initialState),
    withMethods((store) => ({
        toggleSnap(): void {
            patchState(store, (state) => ({
                ...state, snapEnabled: !state.snapEnabled
            }))
        },
        toggleOrtho(): void {
            patchState(store, (state) => ({
                ...state, orthoEnabled: !state.orthoEnabled
            }))
        },
        updateMousePosition(mousePosition: Point): void {
            patchState(store, (state) => ({
                ...state, mousePosition
            }))
        },
        copyEntity(entity: ClipboardEntity): void {
            patchState(store, (state) => ({
                ...state, clipboardEntity: entity
            }))
        },
        clearClipboard(): void {
            patchState(store, (state) => ({
                ...state, clipboardEntity: null
            }))
        }
    }))
)