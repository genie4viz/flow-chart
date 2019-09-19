import React, { useRef, useState } from "react";
import { CSVReader } from "react-papaparse";
import { Layout, Button, Row, Col, InputNumber } from "antd";
import { ClipLoader } from "react-spinners";

import { formatData, adjustData } from "../../globals";
import { FlowChart } from "../../components/chart";
import {Slider} from '../../components/slider';
import "./index.css";

const { Header, Content, Footer } = Layout;

const xcount = 5,
  ycount = 4, duration = 3;

const App = () => {
  const fileInputRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState(60);
  const [isSetting, setIsSetting] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [threshold, setThreshold] = useState(20);

  const fdataRef = useRef(null);
  const adataRef = useRef(null);

  const handleReadCSV = inputedData => {
    setIsLoading(true);
    fdataRef.current = formatData(inputedData.data);    
    adjustData(fdataRef.current, period, threshold, xcount, ycount, res => {
      adataRef.current = res;
      setTimeout(() => {
        setIsStart(false);
        setIsLoading(false);
      }, 500);      
    });
  };

  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err);
  };

  const onImportOffer = () => {
    setIsLoading(true);
    fileInputRef.current.click();
  };

  const onChangePeriod = value => {
    setPeriod(value);
  };

  const onChangeThreshold = value => {
    setThreshold(value);
  };

  const onSet = e => {
    e.preventDefault();
    setIsSetting(true);
    setIsStart(false);
    adjustData(fdataRef.current, period, threshold, xcount, ycount, res => {
      setTimeout(() => {
        adataRef.current = res;
        setIsSetting(false);
      }, 500);
    });
  };

  const onStart = e => {
    setIsStart(false);
    setTimeout(() => {
      setIsStart(true);
    }, 500);
    
  }

  return (
    <Layout className="layout">
      <Header className="header-description">
        <span>People flowing chart</span>
      </Header>
      <Layout>
        <Content
          style={{ padding: 32, display: "flex", flexDirection: "column" }}
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
          <Row style={{ width: "100%", padding: 8 }}>
            <Col span={2}>
              <Button onClick={onImportOffer}>Import CSV</Button>
            </Col>
            <Col
              span={3}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <InputNumber
                min={20}
                max={360}
                style={{ margin: "0 8px" }}
                value={period}
                onChange={onChangePeriod}
              />
              mins
            </Col>
            <Col
              span={3}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <InputNumber
                min={1}
                max={300}
                style={{ margin: "0 8px" }}
                value={threshold}
                onChange={onChangeThreshold}
              />
              dots
            </Col>
            <Col span={2}>
              <Button loading={isSetting} onClick={onSet}>
                Set
              </Button>
            </Col>
          </Row>
          {adataRef.current && (
            <>
              <Row>
                <Col
                  style={{
                    padding: 4,
                    margin: 4,
                    display: "flex",
                    justifyContent: "center"
                  }}
                >
                  <Button onClick={onStart} style={{ margin: 8 }}>
                    Start
                  </Button>
                  <Slider
                    dateFrom={adataRef.current.dateFrom}
                    dateTo={adataRef.current.dateTo}
                    duration={duration * adataRef.current.totalTimes}
                    width={1000}
                    height={60}
                    isStart={isStart}
                  />
                </Col>
              </Row>
              <Row>
                <Col
                  style={{
                    padding: 4,
                    margin: 4,
                    display: "flex",
                    justifyContent: "center",
                    border: "1px solid #33aa00"
                  }}
                >
                  <FlowChart
                    info={adataRef.current}
                    width={1000}
                    height={600}
                    xcount={xcount}
                    ycount={ycount}
                    duration={duration}
                    isStart={isStart}
                  />
                </Col>
              </Row>
            </>
          )}
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
