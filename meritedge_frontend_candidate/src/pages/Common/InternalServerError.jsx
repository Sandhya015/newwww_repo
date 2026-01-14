import { Button, Result } from 'antd';
import { useNavigate } from "react-router-dom";

const InternalServerError = () => {
    const navigate = useNavigate();
    return (
        <div className='flex justify-center items-center h-screen'>
            <Result
                status="500"
                title="500"
                subTitle="Sorry, the page you visited does not exist."
                extra={<Button type="primary" onClick={() => navigate("/")}>Back Home</Button>}
            />
        </div>
    )
};
export default InternalServerError;