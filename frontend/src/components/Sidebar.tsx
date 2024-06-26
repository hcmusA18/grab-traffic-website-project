import React, { useEffect, useState } from 'react'
import { Button, Drawer, Menu, Select } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { MenuOutlined } from '@ant-design/icons'
import { FaHome, FaChartBar } from 'react-icons/fa'
import { useMediaQuery } from 'react-responsive'
import { FaRankingStar } from 'react-icons/fa6'
import { useTranslation } from 'react-i18next'
import './index.css'

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: React.ReactNode
}

const languages = ['en', 'vi']
const flagNames = ['us', 'vn']

const CustomMenu: React.FC<{ mode: 'horizontal' | 'inline' }> = ({ mode }) => {
  const location = useLocation()
  const selectedKey = location.pathname.split('/')[1] ?? 'map'
  const { t } = useTranslation()

  const menuItems: MenuItem[] = [
    {
      key: 'map',
      icon: <FaHome />,
      label: <Link to="/">{t('home')}</Link>
    },
    {
      key: 'chart',
      icon: <FaChartBar />,
      label: <Link to="/chart">{t('chart')}</Link>
    },
    {
      key: 'ranking',
      icon: <FaRankingStar />,
      label: <Link to="/ranking">{t('ranking')}</Link>
    }
  ]

  return (
    <Menu
      mode={mode}
      selectedKeys={[selectedKey]}
      items={menuItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label
      }))}
      style={{ lineHeight: '52px', borderBottom: 0 }} // Ensures vertical alignment for horizontal menu
    />
  )
}

const DesktopSidebar: React.FC = () => {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="shadow-m sticky top-0 z-50 border-b border-gray-200 bg-white py-3">
      <div className="flex flex-row items-center justify-center px-1 py-0 sm:px-6">
        <Link className="float-left w-32" to="/">
          <h3 className="inline-block text-2xl capitalize" style={{ fontFamily: 'Racing Sans One, sans-serif' }}>
            Traffiker
          </h3>
        </Link>
        <div className="flex w-full flex-col items-center justify-between sm:flex-row">
          <div className="w-full">
            <CustomMenu mode="horizontal" />
          </div>
          <Select
            defaultValue={i18n.language}
            style={{ width: 140 }}
            onChange={changeLanguage}
            className="custom-select">
            {languages.map((lang, index) => {
              return (
                <Select.Option key={lang} value={lang}>
                  <span className={`fi fi-${flagNames[index]}`} style={{ marginRight: 8 }}></span>
                  {t(`language.${lang}`)}
                </Select.Option>
              )
            })}
          </Select>
        </div>
      </div>
    </div>
  )
}

const MobileSidebar: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const toggleDrawer = () => setVisible(!visible)
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  useEffect(() => {
    setVisible(false)
  }, [location])

  return (
    <div className="absolute left-4 top-4 z-40 bg-transparent">
      <Button
        className="block h-8 rounded-md border border-gray-300 bg-transparent p-1.5 shadow-md sm:hidden"
        onClick={toggleDrawer}
        icon={<MenuOutlined />}
      />
      <Drawer
        title="Traffiker"
        placement="left"
        closable={true}
        onClose={toggleDrawer}
        open={visible}
        style={{ zIndex: 1000, fontFamily: 'Racing Sans One, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <CustomMenu mode="inline" />
          <Select defaultValue={i18n.language} style={{ width: '100%' }} onChange={changeLanguage}>
            {languages.map((lang, index) => {
              return (
                <Select.Option key={lang} value={lang} label={t(`language.${lang}`)}>
                  <span className={`fi fi-${flagNames[index]}`} style={{ marginRight: 8 }}></span>
                  {t(`language.${lang}`)}
                </Select.Option>
              )
            })}
          </Select>
        </div>
      </Drawer>
    </div>
  )
}

export const Sidebar: React.FC = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })
  return isMobile ? <MobileSidebar /> : <DesktopSidebar />
}
