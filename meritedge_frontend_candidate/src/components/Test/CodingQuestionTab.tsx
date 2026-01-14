import { Tabs } from "antd";

export default function CodingQuestionTab({ props }: { props: any }) {

    return (
        <>
            <Tabs
                activeKey={props?.activeQuestionKey}
                onChange={props?.setActiveQuestionKey}
                items={props?.items}
                className={`
                    [&_.ant-tabs-nav]:!mb-0
                    [&_.ant-tabs-nav-wrap]:pb-3
                    [&_.ant-tabs-tab]:!p-2 [&_.ant-tabs-tab]:!rounded-lg
                    [&_.ant-tabs-tab]:!bg-[#0D0D0D] 
                    [&_.ant-tabs-tab]:!border 
                    [&_.ant-tabs-tab]:!border-[#303036]
                    [&_.ant-tabs-tab-active]:!bg-[#7C3AED30]
                    [&_.ant-tabs-tab-active]:!border-[#7C3AED]
                    [&_.ant-tabs-tab-btn]:!text-[#CCCCCC]
                    [&_.ant-tabs-ink-bar]:hidden
                `}
            />
        </>
    )
}
