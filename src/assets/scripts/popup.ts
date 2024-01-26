import CharacterSelectVue from '@/components/Popup/CharacterSelect.vue'
import { cropperClose, cropperOpen } from '@/components/Popup/Cropper'
import CropperVue from '@/components/Popup/Cropper/Cropper.vue'
import MessageVue from '@/components/Popup/Message.vue'
import { computed, markRaw, reactive, ref, type Component, type ComputedRef } from 'vue'
import { setting } from '../../store/setting'

const components = {
  message: MessageVue,
  select: CharacterSelectVue,
  cropper: CropperVue
}

const callbacks = {
  open: {
    message: (id?: number) => {
      setting.messageID = id
    },
    select: (id?: number) => {
      setting.selectID = id
    },
    cropper: cropperOpen
  },
  close: {
    message: () => {
      setting.messageID = undefined
    },
    select: () => {
      setting.selectID = undefined
    },
    cropper: cropperClose
  },
  enter: {}
}

/*------------------------------------------------------------*/
type Unpacked<T> = T extends Promise<infer U> ? U : T
type ComponentKeys = keyof typeof components

export const popupComponents: Record<
  string,
  {
    compontnt: Component
    index: ComputedRef<number>
  }
> = reactive({})

/** 正在显示的组件 */
export const popup = ref<Set<ComponentKeys>>(new Set())
const _popup = computed(() => Array.from(popup.value))

/** 是否有组件显示 */
export const hasPopup = () => popup.value.size > 0

/** 最后打开的组件 */
export const currentComponent = computed<ComponentKeys | undefined>(
  () => _popup.value[_popup.value.length - 1]
)
/** 关闭最后打开的组件 */
export const closeCurrentWindow = () => {
  if (currentComponent.value) {
    closeWindow(currentComponent.value)
  }
}

/** 组件的确认事件 */
export const enterCallback: Partial<
  Record<ComponentKeys | string, () => (boolean | void) | Promise<boolean | void>>
> = callbacks.enter
/** 执行最后打开组件的确认事件 */
export const currentCallback = () => {
  if (currentComponent.value && enterCallback[currentComponent.value]) {
    return enterCallback[currentComponent.value]?.()
  }
}
let i: ComponentKeys
for (i in components) {
  const key = i
  popupComponents[i] = {
    compontnt: markRaw(components[i]),
    index: computed(() => {
      return _popup.value.indexOf(key)
    })
  }
}

namespace Open {
  export type type = Required<typeof callbacks.open>
  export type keys = keyof Open.type
  export type args<T> = T extends Open.keys ? Parameters<Open.type[T]> : []
  export type result<T> = T extends Open.keys
    ? {
        [K in Open.keys]: Unpacked<ReturnType<Open.type[K]>>
      }[T]
    : void
}
export const openWindow = async <T extends ComponentKeys>(
  key: T,
  ...args: Open.args<T>
): Promise<Open.result<T>> => {
  popup.value.add(key)
  let res
  if (key in callbacks.open) {
    res = await (callbacks.open[key as Open.keys] as (...args: any[]) => any)(...args)
  }
  return res
}

namespace Close {
  export type type = Required<typeof callbacks.close>
  export type keys = keyof Close.type
  export type args<T> = T extends Close.keys ? Parameters<Close.type[T]> : []
  export type result<T> = T extends Close.keys
    ? {
        [K in Close.keys]: Unpacked<ReturnType<Close.type[K]>>
      }[T]
    : void
}
export const closeWindow = async <T extends ComponentKeys>(
  key: T,
  ...args: Close.args<T>
): Promise<Close.result<T>> => {
  popup.value.delete(key)
  let res
  if (key in callbacks.close) {
    res = await (callbacks.close[key as Close.keys] as (...args: any[]) => any)(...args)
  }
  return res
}
