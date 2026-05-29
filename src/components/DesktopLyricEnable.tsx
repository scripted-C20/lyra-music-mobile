import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'

import { toast } from '@/utils/tools'

import { useI18n } from '@/lang'
import { checkDesktopLyricOverlayPermission, hideDesktopLyric, hideStatusBarLyric, openDesktopLyricOverlayPermissionActivity, showDesktopLyric, showStatusBarLyric } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export interface DesktopLyricEnableType {
  setEnabled: (enabled: boolean) => void
}

export default forwardRef<DesktopLyricEnableType, { mode?: 'desktop' | 'statusBar' }>(({ mode = 'desktop' }, ref) => {
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  // const setIsShowDesktopLyric = useDispatch('common', 'setIsShowDesktopLyric')
  const confirmAlertRef = useRef<ConfirmAlertType>(null)

  useImperativeHandle(ref, () => ({
    setEnabled(enabled) {
      void handleChangeEnableDesktopLyric(enabled)
    },
  }))

  const handleShowModal = () => {
    if (visible) confirmAlertRef.current?.setVisible(true)
    else {
      setVisible(true)
      requestAnimationFrame(() => {
        confirmAlertRef.current?.setVisible(true)
      })
    }
  }
  const handleChangeEnableDesktopLyric = async(isEnable: boolean) => {
    if (isEnable) {
      try {
        await checkDesktopLyricOverlayPermission()
        if (mode == 'statusBar') {
          await hideStatusBarLyric()
          await showStatusBarLyric()
          updateSetting({ 'statusBarLyric.enable': true, 'statusBarLyric.isLock': true })
        } else {
          await hideDesktopLyric()
          await showDesktopLyric()
          updateSetting({ 'desktopLyric.enable': true })
        }
      } catch (err) {
        console.log(err)
        updateSetting(mode == 'statusBar' ? { 'statusBarLyric.enable': false } : { 'desktopLyric.enable': false })
        handleShowModal()
      }
    } else {
      if (mode == 'statusBar') await hideStatusBarLyric()
      else await hideDesktopLyric()
      updateSetting(mode == 'statusBar' ? { 'statusBarLyric.enable': false } : { 'desktopLyric.enable': false })
    }
  }

  const handleTipsCancel = () => {
    updateSetting(mode == 'statusBar' ? { 'statusBarLyric.enable': false } : { 'desktopLyric.enable': false })
    toast(t('disagree_tip'), 'long')
  }
  const handleTipsConfirm = () => {
    confirmAlertRef.current?.setVisible(false)
    void openDesktopLyricOverlayPermissionActivity()
  }

  return (
    visible
      ? (
          <ConfirmAlert
            ref={confirmAlertRef}
            onCancel={handleTipsCancel}
            onConfirm={handleTipsConfirm}
            bgHide={false}
            closeBtn={false}
            cancelText={t('disagree')}
            confirmText={t('agree_go')}
            text={t('setting_lyric_desktop_permission_tip')} />
        )
      : null
  )
})
