import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from './combobox'
import { Spinner } from './spinner'

type ValueType = string | number

export interface Item<T extends ValueType> {
  value: T
  label: string
}

interface SearchSelectProps<T extends ValueType> {
  items: Array<Item<T>>
  value?: T | null
  onChange?: (value: T | null) => void
  loading?: boolean
  showClear?: boolean
  placeholder?: string
  'aria-invalid'?: boolean
  [key: string]: any
}

function SearchSelect<T extends ValueType>({
  items,
  value,
  onChange,
  loading = false,
  showClear = false,
  placeholder = 'Select a framework',
  'aria-invalid': ariaInvalid,
  ...rest
}: SearchSelectProps<T>) {
  const parseValue =
    value == null
      ? null
      : (items.find((item) => item.value === value) ?? {
          value,
          label: 'Unknown',
        })

  return (
    <Combobox
      items={items}
      value={parseValue}
      onValueChange={(item, _details) => {
        onChange?.(item?.value ?? null)
      }}
      {...rest}
    >
      <ComboboxInput
        placeholder={placeholder}
        showClear={showClear}
        aria-invalid={ariaInvalid}
      />
      <ComboboxContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item: Item<T>) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

export default SearchSelect
