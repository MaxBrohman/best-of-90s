export const makeInteractiveForIphone = (elem: HTMLElement): void => {
    if(/^(iPhone|iPad|iPod)/.test(navigator.platform)){
        elem.style.cursor = 'pointer';
    }
}