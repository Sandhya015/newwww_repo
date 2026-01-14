import { useState } from 'react';

import { Layout, Badge, Col, Divider, Row, Typography, Button } from "antd";

const { Sider, Content, Footer } = Layout;
const { Text } = Typography;

export default function CodingQuestion({ props }: { props: any }) {
    const question_details = props?.data;

    const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(true);

    const toggleSidebar = () => {
        setIsSideBarOpen((prev) => !prev);
    };

    const [isVSCodeOpen, setIsVSCodeOpen] = useState<boolean>(true);

    const toggleVSCode = () => {
        setIsVSCodeOpen((prev) => !prev);
    };

    return (
        <div>
            <Layout>
                <Sider trigger={null} collapsible collapsed={!isSideBarOpen} className={`!bg-[#0E0E11] h-screen overflow-y-auto m-2.5 px-5 pt-5 pb-10 rounded-xl transition-all duration-300 border border-[#303036]`} width={isVSCodeOpen ? '26%' : '93%'}>
                    {isSideBarOpen ? (
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Text>Problem Description</Text>
                                    </Col>
                                    <Col>
                                        <Row align="middle" justify="center" gutter={20}>
                                            <Col>
                                                <Badge count="06:00" style={{ backgroundColor: "#00ff0033", color: "#3afd8b" }} />
                                            </Col>

                                            {isVSCodeOpen && (
                                                <Col>
                                                    <img src={`${import.meta.env.BASE_URL}common/toggle-icon.svg`} className="object-contain w-6 cursor-pointer" alt="Expanded Logo" onClick={toggleSidebar} />
                                                </Col>
                                            )}
                                        </Row>
                                    </Col>
                                </Row>

                                <div className="mt-5">
                                    <Row className="mb-5" justify="space-between" align="middle">
                                        <Col>
                                            <Text className="font-semibold">
                                                Q{question_details?.id}. {question_details?.question}
                                            </Text>
                                        </Col>

                                        <Col>
                                            <Row align="middle" justify="center">
                                                <Col>
                                                    <div className="border border-[#FFFFFF4D] px-5 py-1.5 rounded-3xl flex items-center gap-2">
                                                        <img src={`${import.meta.env.BASE_URL}test/tag.svg`} alt="tag" className="w-3 h-3" />
                                                        <Text className="text-[#FFFFFF]">{question_details?.question_type}</Text>
                                                    </div>
                                                </Col>

                                                <Col>
                                                    <Divider type="vertical" className="bg-[#FFFFFF4D] !h-5" />
                                                </Col>

                                                <Col className="bg-[#4D4D4E5E] hover:bg-[#fbbb3c] duration-400 p-2 rounded-full">
                                                    <img src={`${import.meta.env.BASE_URL}test/flag.svg`} />
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col span={24}>
                                            <div className="bg-[#000000] p-7 mb-5 rounded-xl">
                                                <span className="text-white opacity-80" dangerouslySetInnerHTML={{ __html: question_details?.question_description || '' }}></span>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex justify-center">
                                <Row justify="center" align="middle">
                                    <Col>
                                        <img
                                            src={`${import.meta.env.BASE_URL}common/toggle-icon.svg`}
                                            className="object-contain w-6 cursor-pointer"
                                            alt="Toggle Sidebar"
                                            onClick={toggleSidebar}
                                        />
                                    </Col>
                                </Row>
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                                <Row justify="center" align="middle">
                                    <Col className="rotate-270 !text-lg font-bold opacity-[0.5]">
                                        Questionary
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    )}
                </Sider>

                <Layout>
                    <Content className={`h-screen m-2.5 flex flex-col !justify-between !rounded-xl border border-[#303036]`}>
                        <Layout>
                            {isSideBarOpen && (
                                <>
                                    <Sider width={isVSCodeOpen ? '5%' : '100%'}>
                                        <div className="bg-[#181818] rounded-tl-xl h-full flex flex-col">
                                            <div className="flex justify-center pt-5">
                                                <img
                                                    src={`${import.meta.env.BASE_URL}common/right-arrow.svg`}
                                                    alt="right-arrow"
                                                    className={`transition-all cursor-pointer ${!isVSCodeOpen && 'rotate-180'}`}
                                                    onClick={toggleVSCode}
                                                />
                                            </div>

                                            {!isVSCodeOpen && (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="rotate-90 text-lg font-bold opacity-50 whitespace-nowrap">
                                                        Editor
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Sider>
                                </>
                            )}

                            {isVSCodeOpen && (
                                <Layout>
                                    <Content className={`${isVSCodeOpen ? 'w-full' : 'w-0'}`}>
                                        <img src={`${import.meta.env.BASE_URL}test/vs-code.png`} alt="vs-code" className="w-full !h-full !rounded-tr-xl" />
                                    </Content>
                                </Layout>
                            )}
                        </Layout>

                        {isVSCodeOpen && (
                            <Footer style={{ textAlign: 'center' }} className="rounded-b-xl">
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <div className="!relative !w-full !rounded-full !overflow-hidden">
                                            <div className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !rounded-full" style={{ background: "conic-gradient(from 0deg at 50% 50%, #1E1E1E 90deg, #FFF 139deg, #FFF 180deg, #FFF 22deg, #1E1E1E 270deg)" }} />

                                            <Button className="!backdrop-blur-[10px] !bg-[#000000] duration-400 !text-white !rounded-full !border-none flex items-center justify-center !px-13 !py-6 !m-[1.5px]" onClick={() => props?.setActiveCodingQuestionKey(String(Number(props?.active_coding_question_key) + 1))}>
                                                Next
                                            </Button>
                                        </div>
                                    </Col>

                                    <Col>
                                        <Text className="text-white opacity-70 cursor-pointer" onClick={() => props?.setActiveCodingQuestionKey(String(Number(props?.active_coding_question_key) + 1))}>Skip</Text>
                                    </Col>
                                </Row>
                            </Footer>
                        )}
                    </Content>
                </Layout>
            </Layout>

            {/* <Row align="middle" justify="space-between">
                <Col>
                    <Sider trigger={null} collapsible collapsed={!isSideBarOpen} className={`!bg-[#0E0E11] h-auto m-2.5 px-5 pt-5 pb-10 flex flex-col justify-between rounded-xl transition-all duration-300 border border-[#303036]`} width={492}>
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Text>Problem Description</Text>
                                    </Col>
                                    <Col>
                                        <Row align="middle" justify="center" gutter={20}>
                                            <Col>
                                                <Badge count="06:00" style={{ backgroundColor: "#00ff0033", color: "#3afd8b" }} />
                                            </Col>
                                            <Col>
                                                <img src={`${import.meta.env.BASE_URL}common/toggle-icon.svg`} className="object-contain w-6" alt="Expanded Logo" onClick={toggleSidebar} />
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                <div className="mt-5">
                                    <Row className="mb-5" justify="space-between" align="middle">
                                        <Col>
                                            <Text className="font-semibold">
                                                Q{question_details?.id}. {question_details?.question}
                                            </Text>
                                        </Col>

                                        <Col>
                                            <Row align="middle" justify="center">
                                                <Col>
                                                    <div className="border border-[#FFFFFF4D] px-5 py-1.5 rounded-3xl flex items-center gap-2">
                                                        <img src={`${import.meta.env.BASE_URL}test/tag.svg`} alt="tag" className="w-3 h-3" />
                                                        <Text className="text-[#FFFFFF]">Python</Text>
                                                    </div>
                                                </Col>

                                                <Col>
                                                    <Divider type="vertical" className="bg-[#FFFFFF4D] !h-5" />
                                                </Col>

                                                <Col className="bg-[#4D4D4E5E] p-2 rounded-full">
                                                    <img src={`${import.meta.env.BASE_URL}test/flag.svg`} />
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col span={24}>
                                            <div className="bg-[#000000] p-7 rounded-xl">
                                                <span className="text-white opacity-80" dangerouslySetInnerHTML={{ __html: question_details?.question_description || '' }}></span>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>
                    </Sider>
                </Col> */}

            {/* <Col>
                    <img src={`${import.meta.env.BASE_URL}test/vs-code.png`} alt="vs-code" className='w-full' />
                </Col> */}
            {/* </Row> */}
        </div>
    )
}
