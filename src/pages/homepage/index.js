import React, {memo, useRef, useState} from 'react';
import { CSVReader } from 'react-papaparse';
import { Layout, Button, Row, Col, InputNumber, Slider} from 'antd';
import { ClipLoader } from 'react-spinners';

import {formatData} from '../../globals';
import {FlowChart} from '../../components/chart';
import './index.css';

const { Header, Content, Footer } = Layout;

const xcount = 5, ycount = 4, period = 60, threshold = 20;

const App = () => {
  
  const fileInputRef = useRef();
  const periodRef = useRef(period);
  const thresholdRef = useRef(threshold);

  const [isLoading, setIsLoading] = useState(false);
  const dataRef = useRef(null);

  const handleReadCSV = inputedData => {    
    dataRef.current = formatData(inputedData.data, periodRef.current, xcount, ycount);
    setIsLoading(false);
  }

  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err);
  }

  const handleImportOffer = () => {
    setIsLoading(true);
    fileInputRef.current.click();
  }

  const onChangePeriod = value => {    
    periodRef.current = value;
  }

  const onChangeThreshold = value => {
    thresholdRef.current = value;
  }

  return (
    <Layout className="layout">
      <Header className="header-description">
        <span>People flowing chart</span>
      </Header>
      <Layout>
        <Content style={{padding: 32, display: 'flex', flexDirection: 'column'}}>
          <CSVReader
            onFileLoaded={handleReadCSV}
            inputRef={fileInputRef}
            style={{display: 'none'}}
            onError={handleOnError}
            configOptions={{              
              fastMode: true,
              skipEmptyLines: true,
            }}
          />
          <Row>
            <Col span={2}>
              <Button onClick={handleImportOffer}>Import</Button>              
            </Col>
            <Col span={4}>
              <InputNumber defaultValue={period} onChange={value => onChangePeriod(value)} />
              <span>{" "}Minutes</span>
            </Col>
          </Row>
          {dataRef.current &&
            <Row>
              <Slider
                min={1}
                max={20}
                onChange={onChangeThreshold}
                defaultValue={20}
                // value={typeof inputValue === 'number' ? inputValue : 0}
              />
            </Row>
          }
          {dataRef.current &&
            <Row>
              <Col style={{padding: 24, margin: 12, display:'flex', justifyContent:'center', border: '1px solid #33aa00'}}>
                <FlowChart info={dataRef.current} width={1000} height={600} xcount={xcount} ycount={ycount}/>
              </Col>
            </Row>
          }
          {isLoading && 
            <Row>
              <Col style={{padding: 16, display:'flex', justifyContent:'center'}}>
                <ClipLoader sizeUnit={"px"} size={50} color={'#ff0090'} />
              </Col>
            </Row>
          }
        </Content>        
      </Layout>
      <Footer className="footer-description">PFC ©2019</Footer>
  </Layout>
  );
}

export default memo(App);
