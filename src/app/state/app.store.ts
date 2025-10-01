import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { Point } from "../types/geometry";

type AppState = {
    snapEnabled: boolean;
    orthoEnabled: boolean;
    mousePosition: Point;
};


const initialState: AppState = {
    snapEnabled: true,
    orthoEnabled: true,
    mousePosition: {x: 0, y: 0}
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
        } 
    }))
)