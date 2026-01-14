import { Col, Row } from 'antd';
import { useState, useEffect } from 'react';

interface TosterProps {
    position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    duration?: number;
    message?: string;
    description?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose?: () => void;
}

export default function Toster({ 
    position = 'top-right',
    duration = 3000,
    message = "You've successfully sent invites to 1 candidates.",
    description = "They will receive an email with further instructions to take the assessment.",
    type = 'success',
    onClose
}: TosterProps) {
    const [progress, setProgress] = useState(100);
    const [isVisible, setIsVisible] = useState(true);

    // Get icon and colors based on type
    const getTypeStyles = () => {
        switch (type) {
            case 'error':
                return {
                    icon: '❌',
                    iconBg: '#7F1D1D',
                    gradientColor: 'rgba(239, 68, 68, 0.12)',
                    progressColor: '#EF4444',
                    borderColor: 'rgba(239, 68, 68, 0.3)'
                };
            case 'warning':
                return {
                    icon: '⚠️',
                    iconBg: '#78350F',
                    gradientColor: 'rgba(251, 191, 36, 0.12)',
                    progressColor: '#FBBF24',
                    borderColor: 'rgba(251, 191, 36, 0.3)'
                };
            case 'info':
                return {
                    icon: 'ℹ️',
                    iconBg: '#1E3A8A',
                    gradientColor: 'rgba(59, 130, 246, 0.12)',
                    progressColor: '#3B82F6',
                    borderColor: 'rgba(59, 130, 246, 0.3)'
                };
            case 'success':
            default:
                return {
                    icon: `${import.meta.env.BASE_URL}question-setting/check_circle.svg`,
                    iconBg: '#303746',
                    gradientColor: 'rgba(0, 237, 123, 0.12)',
                    progressColor: '#01e17b',
                    borderColor: 'rgba(0, 237, 123, 0.3)'
                };
        }
    };

    const typeStyles = getTypeStyles();

    // Position styles based on prop
    const getPositionStyles = (): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: 'none'
        };

        switch (position) {
            case 'top-left':
                return { ...baseStyles, top: '20px', left: '20px' };
            case 'top-right':
                return { ...baseStyles, top: '20px', right: '20px' };
            case 'top-center':
                return { ...baseStyles, top: '20px', left: '50%', transform: 'translateX(-50%)' };
            case 'bottom-left':
                return { ...baseStyles, bottom: '20px', left: '20px' };
            case 'bottom-right':
                return { ...baseStyles, bottom: '20px', right: '20px' };
            case 'bottom-center':
                return { ...baseStyles, bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
            default:
                return { ...baseStyles, top: '20px', right: '20px' };
        }
    };

    useEffect(() => {
        const steps = duration / 100; // 100ms intervals
        const decrementValue = 100 / steps;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 0) {
                    setIsVisible(false);
                    clearInterval(timer);
                    if (onClose) onClose();
                    return 0;
                }
                return prev - decrementValue;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div style={getPositionStyles()}>
            <div className="!w-auto !h-auto" style={{ pointerEvents: 'auto' as React.CSSProperties['pointerEvents'] }}>
                <Row
                    align="middle"
                    style={{
                        padding: "12px 16px",
                        background: "rgba(36, 43, 49, 0.9)",
                        borderRadius: "8px",
                        border: `1px solid ${typeStyles.borderColor}`,
                        boxShadow:
                            "0px 8px 10px #00000033, 0px 6px 30px #0000001f, 0px 16px 24px #00000024",
                        backdropFilter: "blur(15px) brightness(100%)",
                        position: "relative",
                        minWidth: "300px",
                        maxWidth: "400px"
                    }}
                >
                    <Col
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: typeStyles.iconBg,
                            borderRadius: "50%",
                            padding: "4px",
                            minWidth: "32px",
                            minHeight: "32px",
                        }}
                    >
                        {type === 'success' ? (
                            <img src={typeStyles.icon} className="w-7" alt="success" />
                        ) : (
                            <span style={{ fontSize: '20px' }}>{typeStyles.icon}</span>
                        )}
                    </Col>
                    <Col style={{ marginLeft: "16px", flex: 1 }}>
                        <p
                            style={{
                                margin: 0,
                                fontWeight: "bold",
                                color: "white",
                                fontSize: "15px",
                                lineHeight: "22px",
                            }}
                        >
                            {message}
                        </p>
                        <p
                            style={{
                                margin: 0,
                                color: "#c7c5c5",
                                fontSize: "13px",
                                lineHeight: "18px",
                            }}
                        >
                            {description}
                        </p>
                    </Col>
                    <div
                        style={{
                            position: "absolute",
                            width: "212px",
                            height: "212px",
                            top: "-65px",
                            left: "-74px",
                            borderRadius: "50%",
                            background:
                                `radial-gradient(50% 50% at 50% 50%, ${typeStyles.gradientColor} 0%, rgba(0, 0, 0, 0) 100%)`,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: "0px",
                            left: "0px",
                            width: "100%",
                            height: "2px",
                            background: "rgba(255, 255, 255, 0.1)",
                            overflow: "hidden",
                            borderBottomLeftRadius: "8px",
                            borderBottomRightRadius: "8px",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                background: typeStyles.progressColor,
                                width: `${progress}%`,
                                transition: "width 0.1s linear",
                            }}
                        />
                    </div>
                </Row>
            </div>
        </div>
    );
}