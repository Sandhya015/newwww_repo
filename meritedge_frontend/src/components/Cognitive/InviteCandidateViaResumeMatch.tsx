import { Button, Col, Divider, Input, Row, Table, TableColumnsType, Typography, Upload } from "antd";
import { CheckCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Text } = Typography;
const { Dragger } = Upload;

interface InviteDataType {
    key: React.Key;
    name: string;
    email_id: string;
    phone_number: string;
    fit_score: any;
    status: any
}

export default function InviteCandidateViaResumeMatch({ handleInviteCandidateOk }) {
    const [selectedInviteCandidateRowKeys, setSelectedInviteCandidateRowKeys] = useState<React.Key[]>([]);

    // Selected Row Of Invite Candidate
    const rowSelectionOfInviteCandidate = {
        selectedRowKeys: selectedInviteCandidateRowKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedInviteCandidateRowKeys(selectedKeys);
        },
    };

    // Clear All Invite Candidate Selection
    const clearAllInviteCandidateSelection = () => {
        setSelectedInviteCandidateRowKeys([]);
    }

    const columns: TableColumnsType<InviteDataType> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 280,
            sorter: true,
            render: (text) => <span style={{ color: '#fff', fontSize: '14px' }}>{text}</span>,
        },
        {
            title: 'Email ID',
            dataIndex: 'email_id',
            key: 'email_id',
            width: 280,
            sorter: true,
            render: (text) => <span style={{ color: '#fff', fontSize: '14px' }}>{text}</span>,
        },
        {
            title: 'Phone number',
            dataIndex: 'phone_number',
            key: 'phone_number',
            width: 280,
            sorter: true,
            render: (text) => <span style={{ color: '#fff', fontSize: '14px' }}>{text}</span>,
        },
        {
            title: 'Fit Score',
            dataIndex: 'fit_score',
            key: 'fit_score',
            width: 115,
            sorter: true,
            render: (text) => <span style={{ color: '#fff', fontSize: '14px' }} className="!flex !items-center !justify-start gap-2 !w-auto !rounded-full"><img src={`${import.meta.env.BASE_URL}cognitive/star.svg`} /> {text} <img src={`${import.meta.env.BASE_URL}common/info.svg`} /></span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            sorter: true,
            render: (status) => {
                let color = '';
                let backgroundColor = '';
                let icon = null;
                switch (status) {
                    case 'Pending Invite':
                        color = '#ffffff';
                        backgroundColor = '#2C1E15';
                        icon = <img src={`${import.meta.env.BASE_URL}cognitive/smiley-sad.svg`} />;
                        break;
                    case 'Invite Sent':
                        color = '#ffffff';
                        backgroundColor = '#11331F  ';
                        icon = <img src={`${import.meta.env.BASE_URL}cognitive/check-fat.svg`} />;
                        break;
                    default:
                        color = '#fff';
                        backgroundColor = '#1f1f1f';
                        icon = <img src={`${import.meta.env.BASE_URL}cognitive/smiley-sad.svg`} />;
                }
                return (
                    <span
                        className="!flex !items-center !justify-center gap-2 !w-auto !rounded-full"
                        style={{
                            color,
                            backgroundColor,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                        }}
                    >
                        {icon} {status}
                    </span>
                );
            },
        },
    ];

    const inviteCandidateData: InviteDataType[] = [
        {
            key: '1',
            name: 'Vignesh',
            email_id: 'Vignesh234@gmail.com',
            phone_number: '+91 90871 79137',
            fit_score: '76%',
            status: 'Pending Invite',
        },
        {
            key: '2',
            name: 'Arjun',
            email_id: 'Arjun@gmail.com',
            phone_number: '+91 98765 43210',
            fit_score: '70%',
            status: 'Invite Sent',
        },
    ];

    return (
        <>
            <div className="p-3" style={{ width: "100%", position: "relative" }}>
                <Row align="middle" gutter={10}>
                    <Col flex="auto" className="text-white font-semibold mb-5">
                        Submit candidate resumes to see their fit scores, matched against the JD for this assessment. You can also view the <span className="text-[#C4B5FD] underline">Job Description</span> for reference.
                    </Col>

                    <Col flex="auto">
                        <Text strong className="!text-white block mb-2">Upload file</Text>
                        <Dragger
                            style={{
                                backgroundColor: "#0f1014",
                                borderRadius: "10px",
                                border: "1px solid #23263c",
                            }}
                            className="!border-[#23263c] !rounded-xl"
                        >
                            <Row align="middle" gutter={12} justify="start">
                                <Col>
                                    <FileTextOutlined style={{ fontSize: "16px", color: "#657283" }} />
                                </Col>
                                <Col>
                                    <p
                                        style={{
                                            fontFamily: "'Roboto-Regular', Helvetica",
                                            fontSize: "14px",
                                            color: "#657283",
                                            margin: 0,
                                        }}
                                    >
                                        Drag & drop or browse a candidate's resume (.pdf, .docx) to view fit score instantly.
                                    </p>
                                </Col>
                            </Row>
                        </Dragger>
                    </Col>
                    
                    <Col className="text-[#C4B5FD] mt-2">
                        Found 1 candidate entry. To check fit score and add this candidate, click Submit on the right.
                    </Col>
                </Row>

                <Divider type="horizontal" size="small" className="!bg-[#ffffff33] !h-[1px] !mt-8 !mb-6" />

                <Row align="middle" justify="space-between" className="text-white mb-3" style={{ padding: "0 10px" }}>
                    <Col className="font-semibold">
                        Candidate list ({inviteCandidateData?.length})
                    </Col>
                    <Col className="font-semibold">
                        Selected Candidate: {selectedInviteCandidateRowKeys?.length}
                    </Col>
                </Row>

                <Row style={{ padding: "0 10px" }}>
                    <Col span={24}>
                        <Table
                            rowSelection={rowSelectionOfInviteCandidate}
                            columns={columns}
                            dataSource={inviteCandidateData}
                            pagination={{
                                // current: currentPage,
                                // pageSize: pageSize,
                                // total: inviteCandidateData.length,
                                showSizeChanger: true,
                                pageSizeOptions: ['17', '30', '50'],
                                showQuickJumper: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                // onChange: (page, size) => {
                                //     setCurrentPage(page);
                                //     setPageSize(size || 17);
                                // },
                                style: {
                                    marginTop: '16px',
                                    textAlign: 'center',
                                },
                            }}
                            scroll={{ x: true }}
                            size="middle"
                            style={{
                                backgroundColor: '#0d0d0d',
                                width: "100%",
                                overflowX: "auto",
                            }}
                            className="dark-table"
                        />
                    </Col>
                </Row>

                <Row gutter={10} align="middle" justify="end" style={{ padding: "10px 30px" }}>
                    <Col>
                        <Button className="!bg-[#222223] !text-[#8E8E8F] !border !border-[#3E3E40] !rounded-full !w-39 !h-11" onClick={clearAllInviteCandidateSelection}>Clear All</Button>
                    </Col>
                    <Col>
                        <div className="group !relative !w-full !rounded-full !overflow-hidden">
                            <div className="!absolute !inset-0 !h-[100000%] !w-[100000%] !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !animate-[spin_2.3s_linear_infinite] !rounded-full" style={{ background: "conic-gradient(from 90deg at 50% 50%, #1E1E1E 90deg, #C401F7 165deg, #4700EA 179deg, #00A6E8 190deg, #1E1E1E 270deg)" }} />
                        
                            <Button className="!backdrop-blur-[10px] !bg-[#000000] !text-[#8E8E8F] !rounded-full !border-none flex items-center justify-center !px-7 !py-7 !m-[1.5px]" onClick={handleInviteCandidateOk}>
                                <img src={`${import.meta.env.BASE_URL}cognitive/paper-plane-tilt.svg`} className="h-4" /> Send Invite
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    )
}
