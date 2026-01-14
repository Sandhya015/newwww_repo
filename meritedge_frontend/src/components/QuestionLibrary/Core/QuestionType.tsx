import { Button, Col, Collapse, CollapseProps, Input, Row, Tree, TreeDataNode, TreeProps } from "antd";
import { DownOutlined, FileTextOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

// const treeData: TreeDataNode[] = [
//     {
//         title: 'Multiple Choice',
//         key: '0',
//         children: [
//             {
//                 title: 'Multiple Variants (300)',
//                 key: '0-0',
//             },
//             {
//                 title: 'Image-Based (65)',
//                 key: '0-1',
//             },
//         ],
//     },
//     {
//         title: 'Multiple Selection',
//         key: '2',
//         children: [
//             {
//                 title: 'Secure Multiple Selection',
//                 key: '2-1',
//             },
//             {
//                 title: 'Multiple Variants',
//                 key: '2-2',
//             },
//         ],
//     },
// ];

const objectiveQuestionsTreeData: TreeDataNode[] = [
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Multiple Choice</span>
                <span className="text-[#A3A3A3]">365</span>
            </div>
        ),
        key: 'multiple-choice',
        children: [
            {
                title: (
                    <div className="flex justify-between w-full pr-2 pl-2">
                        <span>Multiple Variants</span>
                        <span className="text-[#A3A3A3]">(300)</span>
                    </div>
                ),
                key: 'multiple-variants',
            },
            {
                title: (
                    <div className="flex justify-between w-full pr-2 pl-2">
                        <span>Image-Based</span>
                        <span className="text-[#A3A3A3]">(65)</span>
                    </div>
                ),
                key: 'image-based',
            },
        ],
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Multiple Selection</span>
                <span className="text-[#A3A3A3]">652</span>
            </div>
        ),
        key: 'multiple-selection',
        children: [
            {
                title: (
                    <div className="flex justify-between w-full pr-2 pl-2">
                        <span>Secure Multiple Selection</span>
                    </div>
                ),
                key: 'secure-selection',
            },
            {
                title: (
                    <div className="flex justify-between w-full pr-2 pl-2">
                        <span>Multiple Variants</span>
                    </div>
                ),
                key: 'selection-multiple-variants',
            },
        ],
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>True or False</span>
                <span className="text-[#A3A3A3]">152</span>
            </div>
        ),
        key: 'true-false',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Classification</span>
                <span className="text-[#A3A3A3]">284</span>
            </div>
        ),
        key: 'classification',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Matching Tables</span>
                <span className="text-[#A3A3A3]">63</span>
            </div>
        ),
        key: 'matching-tables',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Match the Following</span>
                <span className="text-[#A3A3A3]">987</span>
            </div>
        ),
        key: 'match-following',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Resequence</span>
                <span className="text-[#A3A3A3]">87</span>
            </div>
        ),
        key: 'resequence',
    },
];

const codingAndTechnicalInputTreeData: TreeDataNode[] = [
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Coding</span>
                <span className="text-[#A3A3A3]">157</span>
            </div>
        ),
        key: 'coding-item',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Simulator</span>
                <span className="text-[#A3A3A3]">289</span>
            </div>
        ),
        key: 'simulator',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Typing</span>
                <span className="text-[#A3A3A3]">372</span>
            </div>
        ),
        key: 'typing',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Essay Type</span>
                <span className="text-[#A3A3A3]">215</span>
            </div>
        ),
        key: 'essay',
    },
    {
        title: (
            <div className="flex justify-between w-full pr-2">
                <span>Text Entry</span>
                <span className="text-[#A3A3A3]">98</span>
            </div>
        ),
        key: 'text-entry',
    },
];


export default function QuestionType() {

    return (
        <>
            <div className="p-4">
                <Row justify="space-between">
                    <Col className="text-[#8C8C8C]">
                        List of Sections (5)
                    </Col>
                    <Col>
                        <Button className="!p-[10px] !bg-[#7C3AED] !rounded-lg !border-none">
                            <PlusOutlined style={{ fontSize: "12px", color: "white" }} />
                        </Button>
                    </Col>
                </Row>

                <Input className="!h-9 !mt-3 !placeholder-[#ffffff] !border-[#23263c] !bg-[#0f1014] !text-white" prefix={<SearchOutlined className="!text-[#ffffff]" />} placeholder="Search assessment..." />
            </div>

            <Collapse
                defaultActiveKey={['1', '2', '3']}
                ghost
                items={[
                    {
                        key: '1',
                        label: <div className="flex items-center gap-3">
                            <img src={`${import.meta.env.BASE_URL}question-library/list-dashes.svg`} />
                            <span className="text-white">Objective Questions</span>
                        </div>,
                        children: <Tree
                            className="!bg-[#16171B] !text-white [&_.ant-tree-node-content-wrapper]:hover:!text-white"
                            checkable
                            showLine
                            defaultExpandAll
                            selectable={false}
                            treeData={objectiveQuestionsTreeData.map(node => ({
                                ...node,
                                isLeaf: true,
                            }))}
                            expandAction={false}
                        />,
                    },
                    {
                        key: '2',
                        label: <div className="flex items-center gap-3">
                            <span className="flex justify-center items-center w-[34px] h-[34px] p-[6px] shrink-0 aspect-square rounded-[6.182px] border border-[#61C1FC] [background:radial-gradient(52.12%_52.12%_at_64.71%_50%,rgba(5,180,255,0.38)_0%,#0F1014_100%)]">
                                <img src={`${import.meta.env.BASE_URL}question-library/code.svg`} />
                            </span>
                            <span className="text-white">Coding & Technical Input</span>
                        </div>,
                        children: <Tree
                            className="!bg-[#16171B] !text-white [&_.ant-tree-node-content-wrapper]:hover:!text-white"
                            checkable
                            showLine={{ showLeafIcon: false }}
                            defaultExpandAll
                            selectable={false}
                            treeData={codingAndTechnicalInputTreeData.map(node => ({
                                ...node,
                                isLeaf: true,
                            }))}
                            expandAction={false}
                        />,
                    },
                ]}
                className="
                    [&_.ant-collapse-header]:!text-white
                    [&_.ant-collapse-content]:!text-white
                    [&_.ant-collapse-expand-icon]:!order-last
                "
            />
        </>
    )
}
