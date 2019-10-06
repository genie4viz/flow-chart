import React, { useRef, useState, Fragment } from "react";
import { CSVReader } from "react-papaparse";
import {
  Layout,
  Button,
  Row,
  Col,
  InputNumber,
  Icon
} from "antd";
import { ClipLoader } from "react-spinners";

import { formatData, adjustData } from "../../globals";
import { FlowChart } from "../../components/chart";
import "./index.css";

const { Header, Content, Footer } = Layout;

const xcount = 8,
  ycount = 6,
  duration = 1;

const App = () => {
  const fileInputRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState(10);
  const [dwell, setDwell] = useState(5);
  const [isSetting, setIsSetting] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [threshold, setThreshold] = useState(1);
  const [bgImage, setBgImage] = useState(null);
  const [imgDimen, setImgDimen] = useState({width: 640, height: 480});
  
  const fdataRef = useRef(null);
  const adataRef = useRef(null);
  const fileUploaderRef = useRef();

  const handleReadCSV = inputedData => {
    setIsLoading(true);
    fdataRef.current = formatData(inputedData.data);
    adjustData(
      fdataRef.current,
      period,
      dwell,
      threshold,
      xcount,
      ycount,
      imgDimen.width,
      imgDimen.height,
      res => {        
        setTimeout(() => {
          adataRef.current = res;
          setIsStart(false);
          setIsLoading(false);  
        }, 500);
      }
    );
  };

  const handleOnError = (err, file, inputElem, reason) => console.log(err);

  const onImportBg = () => fileUploaderRef.current.click();

  const onChangeBgFile = e => {
    e.stopPropagation();
    e.preventDefault();
    const file = e.target.files[0];
    setBgImage(URL.createObjectURL(file));
    var reader = new FileReader();
    reader.onload = function() { // file is loaded
        var img = new Image();
        img.onload = function() {
          setImgDimen({
            width: img.width,
            height: img.height
          });
        };
        img.src = reader.result;
    };  
    reader.readAsDataURL(file);    
  };

  const onImportOffer = () => {
    setIsLoading(true);
    fileInputRef.current.click();
  };

  const onChangePeriod = value => setPeriod(value);
  const onChangeDwelltime = value => setDwell(value);
  const onChangeThreshold = value => setThreshold(value);

  const onSet = e => {
    e.preventDefault();
    setIsSetting(true);
    setIsStart(false);
    adjustData(
      fdataRef.current,
      period,
      dwell,
      threshold,
      xcount,
      ycount,
      imgDimen.width,
      imgDimen.height,
      res => {
        setTimeout(() => {
          adataRef.current = res;          
          setIsSetting(false);
        }, 500);
      }
    );
  };

  const onStart = e => {
    setIsStart(false);
    setTimeout(() => {
      setIsStart(true);
    }, 500);
  };

  return (
    <Layout className="layout">
      <Header className="header-description">
        <span>People flowing chart</span>
      </Header>
      <Layout>
        <Content
          style={{ display: "flex", flexDirection: "column" }}
        >
          <CSVReader
            onFileLoaded={handleReadCSV}
            inputRef={fileInputRef}
            style={{ display: "none" }}
            onError={handleOnError}
            configOptions={{
              fastMode: true,
              skipEmptyLines: true
            }}
          />
          <Row
            style={{              
              padding: 8,
              display: "flex",              
            }}
          >
            <Col span={24}>
              <input
                type="file"
                id="file"
                ref={fileUploaderRef}
                onChange={onChangeBgFile}
                style={{ display: "none" }}
              />
              <Button onClick={onImportBg} style={{margin: 8}}>
                <Icon type="upload" />
                Import Bg
              </Button>            
              <Button onClick={onImportOffer}>Import CSV</Button>            
              <InputNumber
                min={1}
                max={113000}
                style={{ margin: 8 }}
                value={period}
                onChange={onChangePeriod}
              />
              seconds
              <InputNumber
                min={1}
                max={period}
                style={{ margin: 8 }}
                value={dwell}
                onChange={onChangeDwelltime}
              />
              seconds(Dwell)
              <InputNumber
                min={1}
                max={300}
                style={{ margin: 8 }}
                value={threshold}
                onChange={onChangeThreshold}
              />
              dots            
              <Button
                loading={isSetting}
                disabled={adataRef.current === null}
                onClick={onSet}
                style={{margin: 8}}
              >
                Set
              </Button>
              <Button
                onClick={onStart}
                disabled={adataRef.current === null}
                style={{ margin: 8 }}
              >
                Start
              </Button>
            </Col>
          </Row>          
          {adataRef.current ? 
            <FlowChart
              info={adataRef.current}
              width={imgDimen.width}
              height={imgDimen.height}
              xcount={xcount}
              ycount={ycount}
              bgImage={bgImage}              
              duration={duration} // seconds for period
              isStart={isStart}
            />
            : <Fragment>
                <Row>              
                  <Col
                    style={{
                      padding: 4,
                      margin: 4,
                      display: "flex",
                      justifyContent: "center"
                    }}
                  >
                    <div className="chartArea" 
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: imgDimen.width,
                        height: imgDimen.height,
                        background: 'url(' + bgImage + ') no-repeat'
                    }}>
                    </div>
                  </Col>            
                </Row>                
              </Fragment>
          }
          {isLoading && (
            <Row>
              <Col
                style={{
                  padding: 16,
                  display: "flex",
                  justifyContent: "center"
                }}
              >
                <ClipLoader sizeUnit={"px"} size={50} color={"#ff0090"} />
              </Col>
            </Row>
          )}
        </Content>
      </Layout>
      <Footer className="footer-description">PFC ©2019</Footer>
    </Layout>
  );
};

export default App;
