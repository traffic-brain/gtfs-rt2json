import React, { useCallback, useState } from 'react'
import { createRoot } from "react-dom/client";

import { transit_realtime } from '../libs/pb'

function App() {
  const [remoteUrl, setRemoteUrl] = useState('')
  const [file, setFile] = useState<File>()
  const [decodeTarget, setDecodeTarget] = useState<string>()
  const [decodedData, setDecodedData] = useState('')

  const transform = useCallback(async () => {
    if (remoteUrl) {
      setDecodeTarget(`[リモートURL] ${remoteUrl}`)

      try {
        const data = await fetch('https://on7o5qehhza6f66jdn3cnlzjrq0fnaqa.lambda-url.ap-northeast-1.on.aws/?url=' + remoteUrl)
          .then(res => res.arrayBuffer())
        if (data === null) {
          setDecodedData(`"${remoteUrl}"のデータを取得できませんでした`)

          return
        }

        const text = transit_realtime.FeedMessage.decode(new Uint8Array(data))
        setDecodedData(JSON.stringify(text, undefined, 2))
      } catch (err) {
        console.error(err)
        setDecodedData(`"${remoteUrl}"はGTFS Realtimeデータではありません`)
      }
    } else if (file) {
      setDecodeTarget(`[ローカルファイル] ${file.name}`)

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          try {
            const text = transit_realtime.FeedMessage.decode(new Uint8Array(event.target?.result))
            setDecodedData(JSON.stringify(text, undefined, 2))
          } catch (err) {
            console.error(err)
            setDecodedData(`"${file.name}"はGTFS Realtimeデータではありません`)
          }
        }
      };

      reader.readAsArrayBuffer(file);
    }
    else {
      setDecodedData('リモートURLが設定されていないかファイルが選択されていません')
    }
  }, [remoteUrl, file])

  return <>
    <div>リモートURL: <input type="url" onChange={({ target }) => setRemoteUrl(target.value)} /></div>
    <div>ローカルファイル: <input type="file" onChange={({ target }) => setFile(target.files?.[0])} /></div>
    <div style={{ marginTop: 10 }} onClick={transform}><button>変換(リモートURLが優先されます)</button></div>

    <div>変換対象: {decodeTarget}</div>
    <textarea style={{ marginTop: 10, width: '99%', height: '80vh' }} value={decodedData} readOnly></textarea>
  </>;
}

createRoot(document.getElementById("app")!).render(<App />);
