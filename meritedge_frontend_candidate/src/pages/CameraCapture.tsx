import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { useSecureMode } from "../hooks/useSecureMode";

export default function CameraCapture() {
    // Secure mode hook is enabled
    useSecureMode();
    
    const webcamRef = useRef<Webcam>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);

    const [photo, setPhoto] = useState("");
    const [video, setVideo] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    const takePhoto = () => {
        const img = webcamRef.current?.getScreenshot();
        if (img) setPhoto(img);
    };

    const startRecording = () => {
        const stream = (webcamRef.current?.video as HTMLVideoElement)?.srcObject as MediaStream;
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

        recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
        recorder.onstop = () => setVideo(URL.createObjectURL(new Blob(chunks, { type: "video/webm" })));

        recorder.start();
        recorderRef.current = recorder;
        setIsRecording(true);
    };

    const stopRecording = () => {
        recorderRef.current?.stop();
        setIsRecording(false);
    };

    const download = (url: string, filename: string) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    };

    return (
        <div className="p-4 max-w-xl mx-auto">
            <Webcam
                ref={webcamRef}
                audio
                muted
                screenshotFormat="image/png"
                className="w-full rounded shadow"
                videoConstraints={{ facingMode: "user" }}
            />

            <div className="flex gap-2 mt-4">
                <button onClick={takePhoto} className="bg-blue-600 text-white px-4 py-2 rounded">Take Photo</button>
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-2 rounded text-white ${isRecording ? "bg-green-600" : "bg-red-600"}`}
                >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                </button>
            </div>

            {photo && (
                <div className="mt-4">
                    <img src={photo} alt="Captured" className="w-full max-w-sm rounded shadow" />
                    <button onClick={() => download(photo, "photo.png")} className="mt-2 border px-4 py-2 rounded">Download Photo</button>
                </div>
            )}

            {video && (
                <div className="mt-4">
                    <video src={video} controls className="w-full max-w-sm rounded shadow" />
                    <button onClick={() => download(video, "video.webm")} className="mt-2 border px-4 py-2 rounded">Download Video</button>
                </div>
            )}
        </div>
    );
}
