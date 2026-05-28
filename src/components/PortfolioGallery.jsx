import React, { useEffect, useState, useRef } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function PortfolioGallery({ urlPath }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [htmlContent, setHtmlContent] = useState('');
    const [rawText, setRawText] = useState('');
    const [viewType, setViewType] = useState('image');
    const [loading, setLoading] = useState(false);
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!urlPath) return;

        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fullRequestUrl = urlPath.startsWith('http')
            ? urlPath
            : `${BASE_URL}${urlPath}`;

        fetch(fullRequestUrl, {
            method: 'GET',
            headers: headers
        })
            .then(async (res) => {
                const contentType = res.headers.get('content-type') || '';

                if (contentType.includes('image/')) {
                    const blob = await res.blob();
                    return { type: 'image', data: URL.createObjectURL(blob) };
                } else if (contentType.includes('text/html')) {
                    const text = await res.text();
                    return { type: 'html', data: text };
                } else {
                    const text = await res.text();
                    return { type: 'text', data: text };
                }
            })
            .then((result) => {
                setViewType(result.type);
                if (result.type === 'image') {
                    setImageUrl(result.data);
                } else if (result.type === 'html') {
                    setHtmlContent(result.data);
                } else {
                    try {
                        const parsedJson = JSON.parse(result.data);
                        setRawText(JSON.stringify(parsedJson, null, 4));
                    } catch {
                        setRawText(result.data);
                    }
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setViewType('text');
                setRawText('포트폴리오 자원을 가져오지 못했습니다.');
                setLoading(false);
            });

        return () => {
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [urlPath]);

    // contentWindow 존재 여부를 안전하게 검증하여 크래시 방지
    useEffect(() => {
        if (viewType === 'html' && htmlContent && iframeRef.current?.contentWindow) {
            try {
                const frameDoc = iframeRef.current.contentWindow.document;
                if (frameDoc) {
                    frameDoc.open();
                    frameDoc.write(htmlContent);
                    frameDoc.close();
                }
            } catch (e) {
                console.error('프레임 렌더링 중 예외 발생:', e);
            }
        }
    }, [htmlContent, viewType]);

    if (loading) return <div style={{ marginTop: '20px' }}>포트폴리오 갤러리 로딩 중...</div>;

    return (
        <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>포트폴리오 갤러리</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>

                {viewType === 'image' && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', backgroundColor: '#fff' }}>
                        <div style={{ width: '100%', height: '200px', overflow: 'hidden', backgroundColor: '#f7fafc' }}>
                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt="Portfolio Gallery Item"
                                    style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                    }}
                                />
                                )}
                        </div>
                    </div>
                )}

                {viewType === 'html' && (
                    <div style={{ gridColumn: '1 / -1', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <iframe
                            ref={iframeRef}
                            title="Webview"
                            style={{ width: '100%', height: '500px', border: '1px solid #eee', borderRadius: '4px' }}
                        />
                    </div>
                )}

                {viewType === 'text' && (
                    <div style={{ gridColumn: '1 / -1', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <pre style={{ backgroundColor: '#282c34', color: '#abb2bf', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflowX: 'auto', fontSize: '13px', margin: 0 }}>
                            {rawText}
                        </pre>
                    </div>
                )}

            </div>
        </div>
    );
}