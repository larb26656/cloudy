import { useImperativeHandle, forwardRef, useCallback } from "react";

import { useCmdSuggestionHook } from "./useCmdSuggestionHook";
import { CommandListPanel } from "./CommandListPanel";

type MentionListProps = {
  items: string[];
  command: (item: { id: string }) => void;
};

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const itemToValue = (item: string) => item;

    const selectItem = useCallback(
      (item: string) => {
        props.command({ id: item });
      },
      [props],
    );

    const { setCmdRoot, selectedValue, setSelectedValue, onKeyDown } =
      useCmdSuggestionHook<string>({
        items: props.items,
        selectItem,
        itemToValue,
      });

    useImperativeHandle(ref, () => ({
      onKeyDown,
    }));

    return (
      <CommandListPanel
        items={props.items}
        itemToValue={itemToValue}
        selectItem={selectItem}
        setSelectedValue={setSelectedValue}
        renderItem={(item) => <span>{item}</span>}
        renderEmpty={() => "No result"}
        selectedValue={selectedValue}
        cmdRootRef={setCmdRoot}
      />
    );
  },
);

MentionList.displayName = "MentionList";

export default MentionList;
