import { useState } from "react";
import { Card, Col, Collapse, Input, InputNumber, InputNumberProps, Row, Slider, Switch, Typography } from "antd";

const { Text } = Typography;

export default function CommunicationTab() {
    const [cutOffMarkValue, setCutOffMarkValue] = useState(60);

    const onChangeCutOffMark: InputNumberProps['onChange'] = (newValue) => {
        setCutOffMarkValue(newValue as number);
    };

    const [multipleChoiceQuestionsValue, setMultipleChoiceQuestionsValue] = useState(50);

    const onChangeMultipleChoiceQuestions: InputNumberProps['onChange'] = (newValue) => {
        setMultipleChoiceQuestionsValue(newValue as number);
    };

    const [programmingValue, setProgrammingValue] = useState(20);

    const onChangeProgramming: InputNumberProps['onChange'] = (newValue) => {
        setProgrammingValue(newValue as number);
    };

    const [trueFalseValue, setTrueFalseValue] = useState(30);

    const onChangeTrueFalse: InputNumberProps['onChange'] = (newValue) => {
        setTrueFalseValue(newValue as number);
    };

    return (
        <Card
            title={
                <div className="w-full">
                    <div className="text-white font-semibold text-sm sm:text-base lg:text-lg">Communication</div>
                    <span className="text-xs sm:text-sm font-medium !text-[#9CA3AF] block sm:inline">
                        set rules for this section...
                    </span>
                </div>
            }
            extra={<span className="text-white text-xs sm:text-sm">15 mints</span>}
            className="!bg-[#16171B] !border !border-[#2D2E31] !h-full !text-white 
                [&_.ant-card-head]:!border-b-[#2D2E31] 
                [&_.ant-card-head]:!p-3 
                sm:[&_.ant-card-head]:!p-4 
                lg:[&_.ant-card-head]:!p-5
                [&_.ant-card-body]:!p-3
                sm:[&_.ant-card-body]:!p-4
                lg:[&_.ant-card-body]:!p-6"
        >
            <div className="overflow-y-auto grid gap-5">
                <Collapse
                    className="!bg-[#000000] !text-white !border-none !rounded-2xl
                        [&_.ant-collapse-header]:!border-[#191919] [&_.ant-collapse-header]:!border-b
                        [&_.ant-collapse-header]:!bg-[#000000]
                        [&_.ant-collapse-header]:!border-b-2
                        [&_.ant-collapse-header]:!rounded-t-2xl
                        [&_.ant-collapse-header]:!rounded-b-none
                        [&_.ant-collapse-header]:!justify-center
                        [&_.ant-collapse-header]:!p-3
                        sm:[&_.ant-collapse-header]:!p-4
                        lg:[&_.ant-collapse-header]:!p-5
                        [&_.ant-collapse-content]:!bg-[#000000]
                        [&_.ant-collapse-content]:!border-t-[#191919]
                        [&_.ant-collapse-content-box]:!text-white
                        [&_.ant-collapse-content]:!rounded-2xl
                        [&_.ant-collapse-content-box]:!p-3
                        sm:[&_.ant-collapse-content-box]:!p-4
                        lg:[&_.ant-collapse-content-box]:!p-6
                        [&_.ant-collapse-expand-icon]:!text-white"
                    defaultActiveKey={['1']}
                    // onChange={onChange}
                    expandIconPosition="end"
                    items={[
                        {
                            key: "1",
                            label: (
                                <div className="flex flex-row gap-2 sm:gap-3 text-white font-medium items-center w-full text-sm sm:text-base">
                                    <img
                                        src={`${import.meta.env.BASE_URL}question-setting/airplay.svg`}
                                        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                                        alt="Proctoring"
                                    />
                                    <span className="truncate">Proctoring</span>
                                </div>
                            ),
                            children: (
                                <Row
                                    align="top"
                                    gutter={[
                                        { xs: 8, sm: 16, md: 20, lg: 24 },
                                        { xs: 16, sm: 20, md: 24, lg: 24 }
                                    ]}
                                    className="w-full"
                                >
                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/map-pin-area.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Candidate Location
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Enable to auto-fetch the candidate’s current city or region.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/spinner-gap.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Resume Test
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Allow candidate to resume test if accidentally closed.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/eyes.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Eye Ball Detection
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Track candidate eye movement to detect focus or distractions.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/frame-corners.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Disable Screen Extension
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Ensures the test runs in distraction-free full screen.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/crop.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Capture Screenshot
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Takes random screenshots during the test session.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/monitor.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Screen Recording
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Records the candidate’s screen activity to ensure focus and prevent unfair practices.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/files.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Disable Copy-Paste
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Prevents copying and pasting to maintain test integrity.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/scan-smiley.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Face Analysis
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Tracks the candidate’s presence and attention using facial recognition during the test.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/robot.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Ai Assistance
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Guides candidates with smart tips, clarifications, or suggestions to improve their test experience.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={8}>
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                                                    <div className="flex items-center justify-center p-2 sm:p-2.5 bg-black rounded-lg border border-solid border-[#292929] flex-shrink-0">
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/speaker-simple-high.svg`} />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:gap-2 lg:gap-2.5 min-w-0 flex-1">
                                                        <div className="font-normal text-white text-xs sm:text-sm lg:text-sm truncate">
                                                            Audio Analysis
                                                        </div>
                                                        <p className="font-medium text-gray-400 text-xs lg:text-xs leading-tight line-clamp-2">
                                                            Detects background sounds to flag possible disturbances or unauthorized help.
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col flex="none">
                                                <Switch size="small" className="!bg-[#2D2E31] !border !border-[#2D2E31] [&.ant-switch-checked]:!bg-[#7C3AED] sm:!scale-110 lg:!scale-125" />
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            ),
                        },
                    ]}
                />

                <Collapse
                    className="!bg-[#000000] !text-white !border-none !rounded-2xl
                            [&_.ant-collapse-header]:!border-[#191919] [&_.ant-collapse-header]:!border-b
                            [&_.ant-collapse-header]:!bg-[#000000]
                            [&_.ant-collapse-header]:!border-b-2
                            [&_.ant-collapse-header]:!rounded-t-2xl
                            [&_.ant-collapse-header]:!rounded-b-none
                            [&_.ant-collapse-header]:!justify-center
                            [&_.ant-collapse-header]:!p-3
                            sm:[&_.ant-collapse-header]:!p-4
                            lg:[&_.ant-collapse-header]:!p-5
                            [&_.ant-collapse-content]:!bg-[#000000]
                            [&_.ant-collapse-content]:!border-t-[#191919]
                            [&_.ant-collapse-content-box]:!text-white
                            [&_.ant-collapse-content]:!rounded-2xl
                            [&_.ant-collapse-content-box]:!p-3
                            sm:[&_.ant-collapse-content-box]:!p-4
                            lg:[&_.ant-collapse-content-box]:!p-6
                            [&_.ant-collapse-expand-icon]:!text-white"
                    defaultActiveKey={['1']}
                    // onChange={onChange}
                    expandIconPosition="end"
                    items={[
                        {
                            key: "1",
                            label: (
                                <div className="flex flex-row gap-2 sm:gap-3 text-white font-medium items-center w-full text-sm sm:text-base">
                                    <img
                                        src={`${import.meta.env.BASE_URL}question-setting/section-configuration.svg`}
                                        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                                        alt="Proctoring"
                                    />
                                    <span className="truncate">Section Configuration</span>
                                </div>
                            ),
                            children: (
                                <Row
                                    align="top"
                                    className="!w-full grid gap-3"
                                >
                                    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} className="bg-[#0E0E10] rounded-2xl px-[30px] py-5">
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <Row align="middle" gutter={10}>
                                                    <Col>
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/stop-watch.svg`} />
                                                    </Col>
                                                    <Col>
                                                        <Text style={{ color: "white", fontSize: "14px" }}>
                                                            Section Time
                                                        </Text>
                                                    </Col>
                                                </Row>
                                                <Text
                                                    style={{
                                                        color: "#9CA3AF",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    Control how long candidates spend on this section by setting a specific time limit.
                                                </Text>
                                            </Col>

                                            <Col flex="none">
                                                <Row align="middle" gutter={10}>
                                                    <Col>
                                                        <Text
                                                            style={{
                                                                fontSize: "14px",
                                                            }}
                                                        >
                                                            Duration:
                                                        </Text>
                                                    </Col>
                                                    <Col>
                                                        <Input
                                                            defaultValue="00"
                                                            style={{
                                                                width: "50px",
                                                                textAlign: "center",
                                                                backgroundColor: "#0f1014",
                                                                borderColor: "#23263c",
                                                            }}
                                                            onKeyUp={(e) => {
                                                                const target = e.target as HTMLInputElement;
                                                                const numericValue = target.value.replace(/\D/g, "");
                                                                target.value = numericValue;
                                                            }}
                                                        />

                                                        <Text className="ml-2" style={{ color: "#9CA3AF", fontSize: "12px", }}>
                                                            Hours
                                                        </Text>
                                                    </Col>
                                                    <Col>
                                                        <Input
                                                            defaultValue="00"
                                                            style={{
                                                                width: "50px",
                                                                textAlign: "center",
                                                                backgroundColor: "#0f1014",
                                                                borderColor: "#23263c",
                                                            }}
                                                            onKeyUp={(e) => {
                                                                const target = e.target as HTMLInputElement;
                                                                const numericValue = target.value.replace(/\D/g, "");
                                                                target.value = numericValue;
                                                            }}
                                                        />

                                                        <Text className="ml-2" style={{ color: "#9CA3AF", fontSize: "12px", }}>
                                                            Minutes
                                                        </Text>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} className="bg-[#0E0E10] rounded-2xl px-[30px] py-5">
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="1" className="min-w-0">
                                                <Row align="middle" gutter={10}>
                                                    <Col>
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/clock.svg`} />
                                                    </Col>
                                                    <Col>
                                                        <Text style={{ color: "white", fontSize: "14px" }}>
                                                            Section Break Time
                                                        </Text>
                                                    </Col>
                                                </Row>
                                                <Text
                                                    style={{
                                                        color: "#9CA3AF",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    Add a short break after this section by setting a custom pause duration—give candidates time to rest before moving on.
                                                </Text>
                                            </Col>

                                            <Col flex="none">
                                                <Row align="middle" gutter={10}>
                                                    <Col>
                                                        <Text
                                                            style={{
                                                                fontSize: "14px",
                                                            }}
                                                        >
                                                            Duration:
                                                        </Text>
                                                    </Col>
                                                    <Col>
                                                        <Input
                                                            defaultValue="00"
                                                            style={{
                                                                width: "50px",
                                                                textAlign: "center",
                                                                backgroundColor: "#0f1014",
                                                                borderColor: "#23263c",
                                                            }}
                                                            onKeyUp={(e) => {
                                                                const target = e.target as HTMLInputElement;
                                                                const numericValue = target.value.replace(/\D/g, "");
                                                                target.value = numericValue;
                                                            }}
                                                        />

                                                        <Text className="ml-2" style={{ color: "#9CA3AF", fontSize: "12px", }}>
                                                            Hours
                                                        </Text>
                                                    </Col>
                                                    <Col>
                                                        <Input
                                                            defaultValue="00"
                                                            style={{
                                                                width: "50px",
                                                                textAlign: "center",
                                                                backgroundColor: "#0f1014",
                                                                borderColor: "#23263c",
                                                            }}
                                                            onKeyUp={(e) => {
                                                                const target = e.target as HTMLInputElement;
                                                                const numericValue = target.value.replace(/\D/g, "");
                                                                target.value = numericValue;
                                                            }}
                                                        />

                                                        <Text className="ml-2" style={{ color: "#9CA3AF", fontSize: "12px", }}>
                                                            Minutes
                                                        </Text>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} className="bg-[#0E0E10] rounded-2xl px-[30px] py-5">
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="none" className="min-w-0">
                                                <Row align="middle" gutter={10}>
                                                    <Col>
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/percentage.svg`} />
                                                    </Col>
                                                    <Col>
                                                        <Text style={{ color: "white", fontSize: "14px" }}>
                                                            Cut-off Marks
                                                        </Text>
                                                    </Col>
                                                </Row>
                                                <Text
                                                    style={{
                                                        color: "#9CA3AF",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    Define the minimum percentage a candidate must score to pass—set a clear benchmark to qualify.
                                                </Text>
                                            </Col>

                                            <Col flex="1">
                                                <div className="flex items-center gap-4 w-full">
                                                    <Slider
                                                        min={1}
                                                        max={100}
                                                        value={typeof cutOffMarkValue === 'number' ? cutOffMarkValue : 0}
                                                        onChange={onChangeCutOffMark}
                                                        className="
                                                                flex-1
                                                                [&_.ant-slider-rail]:!bg-[#3C3C3C]
                                                                [&_.ant-slider-track]:!bg-[#C9ACF9]
                                                                [&_.ant-slider-handle]:!border-none
                                                                [&_.ant-slider-handle::after]:!bg-[#C9ACF9]
                                                                [&_.ant-slider-handle_.ant-slider-handle-dragging]:!bg-[#C9ACF9]
                                                                [&_.ant-slider-handle]:!shadow-none
                                                                [&_.ant-slider-handle]:!w-4
                                                                [&_.ant-slider-handle]:!h-4
                                                                !h-2
                                                            "
                                                    />
                                                    <InputNumber
                                                        min={1}
                                                        max={100}
                                                        value={cutOffMarkValue}
                                                        onChange={onChangeCutOffMark}
                                                        controls={false}
                                                        onKeyUp={(e) => {
                                                            const target = e.target as HTMLInputElement;
                                                            const numericValue = target.value.replace(/\D/g, "");
                                                            target.value = numericValue;
                                                        }}
                                                        className="!bg-[#1A1A1A] !border-[#606060] !rounded-md !w-16 text-center [&_input]:!text-white [&_input]:!bg-[#1A1A1A] [&_input]:!placeholder-white"
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} className="bg-[#0E0E10] rounded-2xl px-[30px] py-5">
                                        <Row
                                            align="middle"
                                            justify="space-between"
                                            className="w-full"
                                            gutter={[8, 8]}
                                        >
                                            <Col flex="none" className="min-w-0">
                                                <Row align="middle" gutter={10}>
                                                    <Col>
                                                        <img src={`${import.meta.env.BASE_URL}question-setting/focus-cube.svg`} />
                                                    </Col>
                                                    <Col>
                                                        <Text style={{ color: "white", fontSize: "14px" }}>
                                                            Question Type Weightage
                                                        </Text>
                                                    </Col>
                                                </Row>
                                                <Text
                                                    style={{
                                                        color: "#9CA3AF",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    You can assign weightage to each—make sure the total adds up to 100% for a balanced score.
                                                </Text>
                                            </Col>
                                        </Row>

                                        <Row align="middle" justify="space-between" className="bg-[#16171B] border-[#2D2D2D] p-4 rounded-xl mt-5">
                                            <Col flex="1">
                                                Multiple Choice Questions
                                            </Col>

                                            <Col >
                                                <div className="flex items-center gap-4 w-80">
                                                    <Slider
                                                        min={1}
                                                        max={100}
                                                        value={typeof multipleChoiceQuestionsValue === 'number' ? multipleChoiceQuestionsValue : 0}
                                                        onChange={onChangeMultipleChoiceQuestions}
                                                        className="
                                                            flex-1
                                                            [&_.ant-slider-rail]:!bg-[#3C3C3C]
                                                            [&_.ant-slider-track]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle]:!border-none
                                                            [&_.ant-slider-handle::after]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle_.ant-slider-handle-dragging]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle]:!shadow-none
                                                            [&_.ant-slider-handle]:!w-4
                                                            [&_.ant-slider-handle]:!h-4
                                                            !h-2
                                                        "
                                                    />
                                                    <InputNumber
                                                        min={1}
                                                        max={100}
                                                        value={multipleChoiceQuestionsValue}
                                                        onChange={onChangeMultipleChoiceQuestions}
                                                        controls={false}
                                                        onKeyUp={(e) => {
                                                            const target = e.target as HTMLInputElement;
                                                            const numericValue = target.value.replace(/\D/g, "");
                                                            target.value = numericValue;
                                                        }}
                                                        className="!bg-[#1A1A1A] !border-[#606060] !rounded-md !w-16 text-center [&_input]:!text-white [&_input]:!bg-[#1A1A1A] [&_input]:!placeholder-white"
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row align="middle" justify="space-between" className="bg-[#16171B] border-[#2D2D2D] p-4 rounded-xl mt-5">
                                            <Col flex="1">
                                                Programming
                                            </Col>

                                            <Col >
                                                <div className="flex items-center gap-4 w-80">
                                                    <Slider
                                                        min={1}
                                                        max={100}
                                                        value={typeof programmingValue === 'number' ? programmingValue : 0}
                                                        onChange={onChangeProgramming}
                                                        className="
                                                            flex-1
                                                            [&_.ant-slider-rail]:!bg-[#3C3C3C]
                                                            [&_.ant-slider-track]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle]:!border-none
                                                            [&_.ant-slider-handle::after]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle_.ant-slider-handle-dragging]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle]:!shadow-none
                                                            [&_.ant-slider-handle]:!w-4
                                                            [&_.ant-slider-handle]:!h-4
                                                            !h-2
                                                        "
                                                    />
                                                    <InputNumber
                                                        min={1}
                                                        max={100}
                                                        value={programmingValue}
                                                        onChange={onChangeProgramming}
                                                        controls={false}
                                                        onKeyUp={(e) => {
                                                            const target = e.target as HTMLInputElement;
                                                            const numericValue = target.value.replace(/\D/g, "");
                                                            target.value = numericValue;
                                                        }}
                                                        className="!bg-[#1A1A1A] !border-[#606060] !rounded-md !w-16 text-center [&_input]:!text-white [&_input]:!bg-[#1A1A1A] [&_input]:!placeholder-white"
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row align="middle" justify="space-between" className="bg-[#16171B] border-[#2D2D2D] p-4 rounded-xl mt-5">
                                            <Col flex="1">
                                                True or False
                                            </Col>

                                            <Col >
                                                <div className="flex items-center gap-4 w-80">
                                                    <Slider
                                                        min={1}
                                                        max={100}
                                                        value={typeof trueFalseValue === 'number' ? trueFalseValue : 0}
                                                        onChange={onChangeTrueFalse}
                                                        className="
                                                            flex-1
                                                            [&_.ant-slider-rail]:!bg-[#3C3C3C]
                                                            [&_.ant-slider-track]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle]:!border-none
                                                            [&_.ant-slider-handle::after]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle_.ant-slider-handle-dragging]:!bg-[#C9ACF9]
                                                            [&_.ant-slider-handle]:!shadow-none
                                                            [&_.ant-slider-handle]:!w-4
                                                            [&_.ant-slider-handle]:!h-4
                                                            !h-2
                                                        "
                                                    />
                                                    <InputNumber
                                                        min={1}
                                                        max={100}
                                                        value={trueFalseValue}
                                                        onChange={onChangeTrueFalse}
                                                        controls={false}
                                                        onKeyUp={(e) => {
                                                            const target = e.target as HTMLInputElement;
                                                            const numericValue = target.value.replace(/\D/g, "");
                                                            target.value = numericValue;
                                                        }}
                                                        className="!bg-[#1A1A1A] !border-[#606060] !rounded-md !w-16 text-center [&_input]:!text-white [&_input]:!bg-[#1A1A1A] [&_input]:!placeholder-white"
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            ),
                        },
                    ]}
                />
            </div>
        </Card>
    )
}
