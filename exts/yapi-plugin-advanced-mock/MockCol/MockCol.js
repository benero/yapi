import React, { Component } from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom';
import { Table, Button, message, Popconfirm, Tooltip, Icon } from 'antd';
import { fetchMockCol } from 'client/reducer/modules/mockCol'
import { formatTime, getMockText } from 'client/common.js';
import constants from 'client/constants/variable.js'
import CaseDesModal from './CaseDesModal';

@connect(
  state => {
    return {
      list: state.mockCol.list,
      currInterface: state.inter.curdata
    }
  },
  {
    fetchMockCol
  }
)
@withRouter
export default class MockCol extends Component {
  static propTypes = {
    list: PropTypes.array,
    currInterface: PropTypes.object,
    match: PropTypes.object,
    fetchMockCol: PropTypes.func
  }

  state = {
    caseData: {},
    caseDesModalVisible: false,
    isAdd: false
  }

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    const interfaceId = this.props.match.params.actionId
    this.props.fetchMockCol(interfaceId);
  }

  handleOk = async (caseData) => {
    const { caseData: currcase } = this.state;
    const interface_id = this.props.match.params.actionId;
    const project_id = this.props.match.params.id;
    caseData = Object.assign({
      ...caseData,
      interface_id: interface_id,
      project_id: project_id
    })
    if (!this.state.isAdd) {
      caseData.id = currcase._id;
    }
    await axios.post('/api/plugin/advmock/case/save', caseData).then(async res => {
      if (res.data.errcode === 0) {
        message.success(this.state.isAdd ? '添加成功' : '保存成功');
        await this.props.fetchMockCol(interface_id);
        this.setState({ caseDesModalVisible: false })
      } else {
        message.error(res.data.errmsg);
      }
    })
  }

  deleteCase = async (id) => {
    const interface_id = this.props.match.params.actionId;
    await axios.post('/api/plugin/advmock/case/del', {id}).then(async res => {
      if (res.data.errcode === 0) {
        message.success('删除成功');
        await this.props.fetchMockCol(interface_id);
      } else {
        message.error(res.data.errmsg);
      }
    })
  }

  saveFormRef = (form) => {
    this.form = form;
  }

  render() {

    const { list: data, currInterface } = this.props;
    const { isAdd, caseData, caseDesModalVisible } = this.state;
    const initCaseData = {
      ip: '',
      ip_enable: false,
      name: currInterface.title,
      code: '200',
      deplay: 0,
      headers: [{name: '', value: ''}],
      paramsArr: [{name: '', value: ''}],
      res_body: getMockText(currInterface.res_body)
    }

    let ipFilters = [];
    let ipObj = {};
    let userFilters = [];
    let userObj = {};
    data.forEach(item => {
      ipObj[item.ip_enable ? item.ip : ''] = '';
      userObj[item.username] = '';
    })
    ipFilters = Object.keys(Object.assign(ipObj)).map(value => {
      if (!value) {
        value = '无过滤'
      }
      return { text: value, value }
    })
    userFilters = Object.keys(Object.assign(userObj)).map(value => { return { text: value, value } })
    const columns = [{
      title: '期望名称',
      dataIndex: 'name',
      key: 'name'
    }, {
      title: 'ip',
      dataIndex: 'ip',
      key: 'ip',
      render: (text, recode) => {
        if (!recode.ip_enable) {
          text = '';
        }
        return text;
      },
      onFilter: (value, record) => (record.ip === value && record.ip_enable) || (value === '无过滤' && !record.ip_enable),
      filters: ipFilters
    }, {
      title: '创建人',
      dataIndex: 'username',
      key: 'username',
      onFilter: (value, record) => record.username === value,
      filters: userFilters
    }, {
      title: '编辑时间',
      dataIndex: 'up_time',
      key: 'up_time',
      render: text => formatTime(text)
    }, {
      title: '操作',
      dataIndex: '_id',
      key: '_id',
      render: (_id, recode) => {
        return (
          <div>
            <span style={{marginRight: 5}}>
              <Button size="small" onClick={() => this.setState({
                isAdd: false,
                caseDesModalVisible: true,
                caseData: recode
              })}>编辑</Button>
            </span>
            <span>
              <Popconfirm
                title="你确定要删除这条期望?"
                onConfirm={() => this.deleteCase(_id)}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" onClick={() => {}}>删除</Button>
              </Popconfirm>
            </span>
          </div>
        )
      }
    }];

    return (
      <div>
        <div style={{marginBottom: 8}}>
          <Button type="primary" onClick={() => this.setState({
            isAdd: true,
            caseDesModalVisible: true,
            caseData: initCaseData
          })}>添加期望</Button>
          <a target="_blank" rel="noopener noreferrer" href={constants.docHref.adv_mock_case} style={{marginLeft: 8}} >
            <Tooltip title="点击查看文档"><Icon type="question-circle-o" /></Tooltip>
          </a>
        </div>
        <Table columns={columns} dataSource={data} pagination={false} rowKey='_id' />
        <CaseDesModal
          visible={caseDesModalVisible}
          isAdd={isAdd}
          caseData={caseData}
          onOk={this.handleOk}
          onCancel={() => this.setState({caseDesModalVisible: false})}
          ref={this.saveFormRef}
        ></CaseDesModal>
      </div>
    )
  }
}