import { computePosition, flip, shift } from '@floating-ui/dom'
import { posToDOMRect, ReactRenderer } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import type { MentionListRef } from './MentionList'
import MentionList from './MentionList'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type { MentionNodeAttrs } from '@tiptap/extension-mention'
import { useFindFileStore } from '@/stores'

type MentionItem = string

type MentionSuggestionProps = SuggestionProps<MentionItem, MentionNodeAttrs>

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to
      ),
  }

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = 'max-content'
    element.style.position = strategy
    element.style.left = `${x}px`
    element.style.top = `${y}px`
  })
}

export function createMentionSuggestion(directory: string) {
  const { searchFiles } = useFindFileStore.getState();
  return {
    items: async ({ query }: { query: string }): Promise<string[]> => {
      return searchFiles(directory, query);
    },

    render: () => {
      let component: ReactRenderer<MentionListRef> | null = null

      return {
        onStart: (props: MentionSuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) return

          component.element.style.position = 'absolute'
          document.body.appendChild(component.element)

          updatePosition(props.editor, component.element)
        },

        onUpdate: (props: MentionSuggestionProps) => {
          component?.updateProps(props)

          if (!props.clientRect) return

          updatePosition(props.editor, component!.element)
        },

        onKeyDown: (props: SuggestionKeyDownProps) => {

          if (props.event.key === 'Escape') {
            component?.destroy()
            return true
          }

          return component?.ref?.onKeyDown(props) ?? false
        },

        onExit: () => {
          if (!component) return

          component.element.remove()
          component.destroy()
          component = null
        },
      }
    },
  }
}