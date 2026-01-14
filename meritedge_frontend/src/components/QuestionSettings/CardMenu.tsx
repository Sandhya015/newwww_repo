import { Layout, Menu } from 'antd';

const { Sider } = Layout;

interface QuestionSettingsCardMenuProps {
    onMenuChange: (key: string) => void;
    selectedKey: string;
}

export default function QuestionSettingsCardMenu({ onMenuChange, selectedKey }: QuestionSettingsCardMenuProps) {
    const handleMenuClick = ({ key }: { key: string }) => {
        onMenuChange(key);
    };

    return (
        <Sider trigger={null} className="h-auto flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-primary)', borderRight: '1px solid var(--border-primary)' }} width={195}>
            <div className="pt-8 px-4 question-settings-menu" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                <Menu 
                    mode="vertical" 
                    theme="dark" 
                    defaultSelectedKeys={['general']} 
                    style={{ width: '100%', backgroundColor: 'var(--bg-primary)', fontSize: '16px', padding: 0, margin: 0 }} 
                    className="question-settings-menu-items [&_.ant-menu-item-selected]:!bg-[var(--accent-primary)] [&_.ant-menu-item-selected]:!text-white [&_.ant-menu-item-selected]:!rounded-md [&_.ant-menu-item:hover]:!bg-[var(--bg-tertiary)] [&_.ant-menu-item:hover]:!text-[var(--text-primary)] [&_.ant-menu-item]:!text-[var(--text-primary)] [&_.ant-menu-item]:!rounded-md [&_.ant-menu-item]:!text-base [&_.ant-menu-item]:!m-0 [&_.ant-menu-item]:!mb-0" 
                    selectedKeys={[selectedKey]} 
                    onClick={handleMenuClick}
                >
                    <Menu.Item key="general" icon={<img src={`${import.meta.env.BASE_URL}question-setting/gear-six.svg`} style={{ filter: 'var(--icon-filter)' }} />}>
                        General
                    </Menu.Item>

                    <Menu.Item key="section" icon={<img src={`${import.meta.env.BASE_URL}question-setting/sections.svg`} style={{ filter: 'var(--icon-filter)' }} />}>
                        Section
                    </Menu.Item>

                    {/* <Menu.Item key="orders" icon={<img src={`${import.meta.env.BASE_URL}question-setting/list-bullets.svg`} style={{ filter: 'var(--icon-filter)' }} />}>
                        Orders
                    </Menu.Item> */}
                </Menu>
            </div>
        </Sider>
    );
}
