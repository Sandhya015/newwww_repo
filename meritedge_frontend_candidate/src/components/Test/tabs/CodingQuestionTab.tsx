import { Tabs } from "antd";
import CodingQuestion from "../questions/CodingQuestion";

export default function CodingQuestionTab({ props }: { props: any }) {
    const active_coding_question_key = props?.activeCodingQuestionKey;
    const setActiveCodingQuestionKey = props?.setActiveCodingQuestionKey;

    const MCQQuestions = props?.codingDatas?.map((data) => {
        return {
            key: data?.id,
            label: (
                <div className={`flex items-center gap-2`}>
                    {data?.is_answered == 1 ? (
                        <img src={`${import.meta.env.BASE_URL}common/check-circle.svg`} alt="check-circle" className="w-3 h-3" />
                    ) : data?.is_flagged == 1 ? (
                        <img src={`${import.meta.env.BASE_URL}test/orange-flag.svg`} alt="orange-flag" className="w-3 h-3" />
                    ) : data?.is_skipped == 1 ? (
                        <img src={`${import.meta.env.BASE_URL}test/skip-forward.svg`} alt="skip-forward" className="w-3 h-3" />
                    ) : (
                        <span className={`w-3 h-3 rounded-full border-2 ${active_coding_question_key == data?.id ? "border-[#7C3AED]" : "border-[#6B6B71]"}`}></span>
                    )}

                    Q{data?.id}
                </div>
            ),
            children: <CodingQuestion props={{ data, active_coding_question_key, setActiveCodingQuestionKey }} />,
        };
    });

    return (
        <Tabs
            activeKey={props?.activeCodingQuestionKey}
            onChange={props?.setActiveCodingQuestionKey}
            items={MCQQuestions}
            className={`
                [&_.ant-tabs-nav]:!mt-3
                [&_.ant-tabs-nav-wrap]:pb-3
                [&_.ant-tabs-tab]:!p-2 [&_.ant-tabs-tab]:!rounded-lg
                [&_.ant-tabs-tab]:!bg-[#0D0D0D] 
                [&_.ant-tabs-tab:nth-child(1)]:!bg-[#0D2F09] 
                [&_.ant-tabs-tab:nth-child(2)]:!bg-[#0D2F09] 
                [&_.ant-tabs-tab]:!border 
                [&_.ant-tabs-tab]:!border-[#303036]
                [&_.ant-tabs-tab-active]:!bg-[#7C3AED30]
                [&_.ant-tabs-tab-active]:!border-[#7C3AED]
                [&_.ant-tabs-tab-btn]:!text-[#CCCCCC]
                [&_.ant-tabs-ink-bar]:hidden
            `}
        />
    );
}
