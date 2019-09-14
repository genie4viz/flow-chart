import React, {memo} from 'react';
import { Layout } from 'antd';
import {FlowChart} from '../../components/chart';

import './index.css';
const { Header, Content, Footer } = Layout;

const App = () => {  


  return (
    <Layout className="layout">
      <Header className="header-description">        
        <span>People flowing chart</span>
      </Header>
      <Layout>
        <Content>
          <FlowChart />
        </Content>        
      </Layout>
      <Footer className="footer-description">PFC ©2019</Footer>
  </Layout>
  );
}

export default memo(App);
