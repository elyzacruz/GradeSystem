import React, { Component } from 'react';
import { isEmpty } from 'lodash';
import { Layout, Button, Icon, Table, Dropdown, Menu, Divider, Alert } from 'antd';
import './App.css';

import { VALID_FILE, headerStyle, contentStyle, titleStyle } from './Constants';
import { submitGrades, fetchGrades, getStoredData, clearGrades } from './actions';

const { Header, Content } = Layout;
const { SubMenu } = Menu;

const initialState = {
  file: null,
  errMessage: null,
  selectedYear: null,
  qtrMap: {},
  grades: []
};

class App extends Component {
  state = initialState;

  async componentDidMount() {
    try {
      const data = await getStoredData();
      if(data && !isEmpty(data)){
        const initYear = Object.keys(data)[0];
        const newGrades = await fetchGrades({
          year: initYear,
          quarter: data[initYear][0]
        });

        this.setState({
          qtrMap: data,
          grades: newGrades.grades,
          selectedQtr: newGrades.quarter,
          selectedYear: newGrades.year
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  onSubmit = async () => {
    try {
      const { file } = this.state;
      if (file) {
        const data = await submitGrades(file);
        const qtrMap = await getStoredData();

        this.setState({
          grades: data.grades,
          selectedQtr: data.quarter,
          selectedYear: data.year,
          file: null,
          qtrMap
        });
      } else {
        this.setState({ errMessage: 'No Grade Files Uploaded.' })
      }
    } catch (e) {
      console.log(e);
    }
  }

  onChangeFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop();
      if (ext === VALID_FILE) {
        this.setState({ file, errMessage: null });
      } else {
        this.setState({ errMessage: 'Invalid File Format' });
      }
    }
  }

  clearGrades = async () => {
    try {
      const data = clearGrades();
      this.setState({
        ...initialState
      })
    } catch (e) {
      console.log(e);
    }
  }

  removeFile = () => {
    this.setState({
      file: null,
      errMessage: null
    })
  };

  fetchQuarterData = async item => {
    const { key: qtr, item: { props: { parentMenu: parent } } } = item;
    const { props: { title: year } } = parent;
    try {
      const data = await fetchGrades({
        year,
        quarter: qtr
      });
      this.setState({
        grades: data.grades,
        selectedQtr: data.quarter,
        selectedYear: data.year
      });
    } catch (e) {
      console.log(e);
    }
  }

  renderFileUpload = () => {
    const { file } = this.state;

    return (
      <form id='id-upload-grades'>
        <div className="upload-button-wrapper">
          <Button><Icon type='upload' />Upload Grades (.txt)</Button>
          <input type="file" name="myfile" onChange={this.onChangeFile} />
        </div>
        <div id='id-file'>
          {file && (<div>
            <label>{`${file.name}`}</label>
            <button onClick={this.removeFile}>x</button>
          </div>
          )}
        </div>
      </form>
    );
  };

  renderStudentInfo = () => {
    const { qtrMap, selectedYear, selectedQtr } = this.state;

    const createMenuItems = quarters =>
      quarters.map(qtr => (<Menu.Item key={qtr}
        onClick={item => this.fetchQuarterData(item)}
      >
        {`Quarter ${qtr}`}
      </Menu.Item>));

    if (!isEmpty(qtrMap)) {
      const menu = (
        <Menu selectable>
          {Object.keys(qtrMap).map(yearKey => (
            <SubMenu key={yearKey} title={`${yearKey}`}>
              {createMenuItems(qtrMap[yearKey].sort())}
            </SubMenu>
          )
          )}
        </Menu>
      );

      return (<div className='student-list-info'>
        <Dropdown overlay={menu}>
          <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
            Academic School Years <Icon type="down" />
          </a>
        </Dropdown>
        {selectedYear && selectedQtr &&
          (<div>
            <label>{`Year: ${selectedYear}`}</label>
            <label>{`Quarter: ${selectedQtr}`}</label>
          </div>)
        }
      </div>);
    }

    return null;
  }

  renderStudentGradeList = () => {
    const { grades } = this.state;
    const columns = [
      {
        title: `Students ${grades.length ? grades.length : ''}`,
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: 'Average',
        dataIndex: 'average',
        key: 'average',
      }
    ];

    const data = grades.map(
      (grade, index) => ({
        key: `${index}`,
        name: grade.name,
        average: grade.average
      })
    );

    return (
      <Table
        columns={columns}
        dataSource={data}
        title={() => 'Student Grades'}
      />
    );
  }

  renderFileFormat = () => (
    <div className='upload-div'>
      <div className='upload-def'>
        <label>Please upload grades in the following format:</label>
        <ul>
          <li>Quarter 1, 2020</li>
          <li>Jimmy Doe H 73 99 98 83 85 92 100 60 74 98 92 T 84 96 79 91 95</li>
          <li>Susan Smith H 75 88 94 95 84 68 91 74 100 82 93 T 73 82 81 92 85</li>
          <li>...</li>
          <br />
          <li>Note: Upload and calculate 1 Quarter at a time</li>
        </ul>
      </div>
      <div className='upload-form'>
        {this.renderFileUpload()}
      </div>
    </div>
  );

  render = () => {
    const { errMessage, qtrMap, grades } = this.state;

    return (
      <Layout className="layout">
        <Header style={headerStyle}>
          <h1 style={titleStyle}>Grade System</h1>
        </Header>
        <Content className='layout-content' style={contentStyle}>
          {this.renderFileFormat()}
          <div className='submit-grades'>
            <Button onClick={this.onSubmit}>Calculate grades</Button>
            {!!errMessage && (
              <Alert
                type='error'
                message={errMessage}
                closable
                onClose={
                  () => this.setState({ errMessage: null })
                }
              />
            )}
          </div>
          <Divider />
          {!isEmpty(qtrMap) ?
            <div className='student-list-info'>
              {this.renderStudentInfo()}
              <Button onClick={this.clearGrades}>Clear ALL Grades</Button>
            </div> : 'No uploaded grades.'
          }
          {!!grades.length && this.renderStudentGradeList()}
        </Content>
      </Layout>
    );
  };
}

export default App;