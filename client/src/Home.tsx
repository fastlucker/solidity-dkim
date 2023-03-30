import { useState, useCallback } from "react";
import { observer } from "mobx-react";
import Dropzone from "react-dropzone";
import Metamask from "./components/MetaMask";
import eth from "./stores/eth";
import { InsertDriveFileOutlined, AttachFile } from "@material-ui/icons";
import parseEmail from "./parse-email/browser";
import toSolidity from "./parse-email/utils/toSolidity";

const verify = (email: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const DKIM = await eth.getContract("DKIM").catch(reject);

    const dkims = await parseEmail(email);

    const dkimsInBytes = dkims.map(dkim => {
      return toSolidity({
        algorithm: dkim.algorithm,
        hash: dkim.hash,
        signature: dkim.signature.signature,
        exponent: dkim.exponent,
        modulus: dkim.modulus,
        signatureData: dkim.signature
      });
    });

    const result = Promise.all(
      dkimsInBytes.map((dkim, i) => {
        return DKIM.verify(
          dkim.algorithm,
          dkim.hash,
          dkim.signature,
          dkim.exponent,
          dkim.modulus
        ).then(res => ({
          name: dkims[i].entry.name,
          verified: res["0"],
          signatureData: dkim.signatureData
        }));
      })
    ).catch(reject);

    return resolve(result);
  });
};

const Home = observer(() => {
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState([]);
  const [dragging, setDrag] = useState(false);
  const disabled =
    !eth.isInstalled ||
    !(eth.network === "sepolia" || eth.network === "unknown network");

  const onDrop = useCallback(files => {
    setEmail(null);
    setError(null);
    setVerified([]);

    if (files.length < 1) {
      return setError("no file included");
    }
    const file = files[0];

    const reader = new FileReader();

    reader.onabort = () => setError("file reading was aborted");
    reader.onerror = () => setError("file reading has failed");
    reader.onload = () => setEmail(reader.result);

    reader.readAsText(file);
  }, []);

  return (
    <div className="container">
      <h2>solidity-dkim demo</h2>

      <Metamask />
      <Dropzone
        onDrop={onDrop}
        multiple={false}
        onDragEnter={() => setDrag(true)}
        onDragLeave={() => setDrag(false)}
      >
        {({ getRootProps, getInputProps }) => (
          <section>
            <div
              {...getRootProps({
                style: {
                  width: "50vw",
                  height: "30vh",
                  alignItems: "center",
                  justifyContent: "center",
                  display: "flex",
                  border:
                    dragging || email
                      ? "3px solid #387fc7"
                      : "3px dashed #387fc7",
                  backgroundColor: "white",
                  margin: "50px",
                  borderRadius: "3px",
                  cursor: "pointer"
                }
              })}
            >
              <input {...getInputProps()} />
              {email ? (
                <div className="fileUploaded">
                  <InsertDriveFileOutlined
                    style={{ height: "8vh", width: "auto", color: "#397ec7" }}
                  />{" "}
                  FILE LOADED
                </div>
              ) : (
                <div className="fileUploaded">
                  <AttachFile
                    style={{ height: "8vh", width: "auto", color: "#397ec7" }}
                  />
                  <p>Drag 'n' drop some files here, or click to select files</p>
                </div>
              )}
            </div>
          </section>
        )}
      </Dropzone>

      <button
        onClick={() =>
          verify(email)
            .then(setVerified)
            .catch(setError)
        }
        disabled={disabled}
      >
        Verify
      </button>
      {error ? (
        <p className="error">error: {error}</p>
      ) : verified.length > 0 ? (
        verified.map(result =>
          result.verified ? (
            <div className="verified__wrapper">
              <h1 key={result.name} className="verified">
                {result.name}: verified! 🎉
              </h1>
              <p className="verified__signature">
                <b>Signature:</b> {result.signatureData.signature}
              </p>
              <p>
                <b>Domain:</b> {result.signatureData && result.signatureData.domain}
              </p>
              <p>
              <b>Expires:</b> {result.signatureData && new Date (Number(result.signatureData.expires + 1000)).toLocaleString('en-US', {
                  weekday: 'long',
                  day: 'numeric', 
                  month: "2-digit", 
                  year: "numeric"
                })}
              </p>
            </div>
          ) : (
            <h1 key={result.name} className="not-verified">
              {result.name}: not verified 😔
            </h1>
          )
        )
      ) : (
        ""
      )}

      <style jsx global>{`
        html {
          background: aliceblue;
        }
       
        `}</style>

      <style jsx>{`
        .container {
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 20px;
        }
        h2 {
          margin-top: 100px;
          margin-bottom: 30px;
        }
        button {
          height: 30px;
          width: 120px;
          border-radius: 3px;
          background: #397ec7;
          color: white;
          border: none;
          font-family: sans-serif;
          font-size: 16px;
          cursor: pointer;
          opacity: ${disabled ? "0.5" : "1"};
        }
        .error {
          color: #d60000;
        }
        .verified__wrapper {
          margin-top: 50px;
          max-width: 50%;
          padding: 5px;
          border: 1px solid rgb(56, 127, 199);
          border-radius: 5px;
        }
        .verified__wrapper h1 {
          margin-bottom: 0;
        }
        .verified__signature {
          word-break: break-all;
        }
        .verified {
          color: #00bb39;
        }
        .not-verified {
          color: #d60000;
        }
        .fileUploaded {
          height: 12vh;
          justify-content: center;
          align-items: center;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
});

export default Home;
