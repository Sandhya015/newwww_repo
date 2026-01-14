import { useState } from 'react';

import { Layout, Badge, Col, Divider, Image, Row, Typography } from "antd";

const { Sider } = Layout;
const { Text, Paragraph } = Typography;

export default function CodingQuestion({ props }: { props: any }) {
    const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(true);

    const toggleSidebar = () => {
        setIsSideBarOpen((prev) => !prev);
    };

    return (
        <div>
            <Row align="middle" justify="space-between">
                <Col>
                    <Sider trigger={null} collapsible collapsed={!isSideBarOpen} className={`!bg-[#0E0E11] h-auto m-2.5 px-5 pt-5 pb-10 flex flex-col justify-between rounded-xl transition-all duration-300 border border-[#303036]`} width={492}>
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Text>Problem Description {props?.qNum}</Text>
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
                                                Q1. Data Processing &amp; Perfor...
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
                                                <Paragraph>
                                                    <span>
                                                        You are given a binary tree where each node contains an integer
                                                        value. Write a Python program that does the following:
                                                        <br />
                                                        Traverse the tree using a combination of Depth-First Search
                                                        (DFS) and Breadth-First Search (BFS).
                                                        <br />
                                                        First, perform a DFS to find all leaf nodes.
                                                        <br />
                                                        Then, perform a BFS starting from the root, but skip any paths
                                                        that lead only to leaves already visited by DFS.
                                                        <br />
                                                        You must keep memory usage minimal when handling trees with
                                                        thousands of nodes and make the traversal logic reusable.
                                                        <br />
                                                        <br />
                                                        class TreeNode: <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;def __init__(self, val=0, left=None,
                                                        right=None): <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.val = val{" "}
                                                        <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.left = left{" "}
                                                        <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.right =
                                                        right <br /> <br /># Example function signatures <br />
                                                        def find_leaves(root): <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;# DFS logic here <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;pass <br /> <br />
                                                        def bfs_non_leaves(root, leaves): <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;# BFS logic here <br />
                                                        &nbsp;&nbsp;&nbsp;&nbsp;pass <br /> <br /># Example usage:{" "}
                                                        <br /># root = TreeNode(...) <br /># leaves = find_leaves(root){" "}
                                                        <br /># non_leaves = bfs_non_leaves(root, leaves)
                                                        <br />
                                                        <br />
                                                    </span>

                                                    <span>Input:{"  "}</span>

                                                    <span>
                                                        root = [ <br />
                                                        &nbsp;&nbsp;1, <br />
                                                        &nbsp;&nbsp;2, 3, <br />
                                                        &nbsp;&nbsp;4, 5, 6, 7, <br />
                                                        &nbsp;&nbsp;8, 9, null, null, 10, 11, null, 12 <br />]<br />
                                                        <br />
                                                    </span>

                                                    <span>
                                                        Output:
                                                        <br />
                                                    </span>

                                                    <span>
                                                        DFS Leaves: [8, 9, 10, 11, 12] <br />
                                                        BFS (excluding DFS leaves): [1, 2, 3, 4, 5, 6, 7] <br />
                                                    </span>

                                                    <span>
                                                        <br />
                                                    </span>
                                                </Paragraph>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>
                    </Sider>
                </Col>
                
                {/* <Col>
                    <img src={`${import.meta.env.BASE_URL}test/vs-code.png`} alt="vs-code" className='w-full' />
                </Col> */}
            </Row>
        </div>
    )
}
