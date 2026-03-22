const parentTitlePrefix = "New session - ";
const childTitlePrefix = "Child session - ";

export function createDefaultTitle(isChild = false) {
    return (isChild ? childTitlePrefix : parentTitlePrefix) + new Date().toISOString();
}