'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Space, Tag, message, Card, Modal, Form, InputNumber, Switch, Popconfirm } from 'antd';
import { SearchOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

interface Account {
  id: number;
  username: string;
  ban: number;
  is_admin: boolean;
  vnd: number;
  tongnap: number;
  coin: number;
  create_time: string | null;
  last_time_login: string | null;
  ip_address: string | null;
  email: string | null;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [banFilter, setBanFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [editModal, setEditModal] = useState<{ visible: boolean; account: Account | null }>({ visible: false, account: null });
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
        ban: banFilter,
      });

      const response = await fetch(`/api/admin/accounts?${params}`);
      const data = await response.json();

      if (data.success) {
        setAccounts(data.data.items);
        setPagination(prev => ({ ...prev, total: data.data.total }));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      message.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, search, banFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    }));
  };

  const handleBan = async (id: number, currentBan: number) => {
    try {
      const response = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ban: currentBan === 0 ? 1 : 0 }),
      });
      const data = await response.json();
      if (data.success) {
        message.success(currentBan === 0 ? 'Account banned' : 'Account unbanned');
        fetchAccounts();
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to update');
    }
  };

  const openEditModal = (account: Account) => {
    setEditModal({ visible: true, account });
    form.setFieldsValue({
      vnd: account.vnd,
      coin: account.coin,
      tongnap: account.tongnap,
      is_admin: account.is_admin,
    });
  };

  const handleSave = async () => {
    if (!editModal.account) return;
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const response = await fetch(`/api/admin/accounts/${editModal.account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (data.success) {
        message.success('Account updated');
        setEditModal({ visible: false, account: null });
        fetchAccounts();
      } else {
        message.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        message.success('Account deleted');
        fetchAccounts();
      } else {
        message.error(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/admin/accounts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRowKeys }),
      });
      const data = await response.json();
      if (data.success) {
        message.success(data.message);
        setSelectedRowKeys([]);
        fetchAccounts();
      } else {
        message.error(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnsType<Account> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{username}</span>
          {record.is_admin && <Tag color="gold">Admin</Tag>}
        </Space>
      ),
    },
    {
      title: 'VND',
      dataIndex: 'vnd',
      key: 'vnd',
      render: (val: number) => <span style={{ color: '#52c41a' }}>{val.toLocaleString()}</span>,
    },
    {
      title: 'Total Nạp',
      dataIndex: 'tongnap',
      key: 'tongnap',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: 'Coin',
      dataIndex: 'coin',
      key: 'coin',
      render: (val: number) => <span style={{ color: '#faad14' }}>{val.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'ban',
      key: 'ban',
      render: (ban: number) => ban === 0 
        ? <Tag color="success">Active</Tag> 
        : <Tag color="error">Banned</Tag>,
    },
    {
      title: 'Last Login',
      dataIndex: 'last_time_login',
      key: 'last_time_login',
      render: (date: string | null) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string | null) => ip || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Button
            size="small"
            danger={record.ban === 0}
            icon={record.ban === 0 ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleBan(record.id, record.ban)}
          />
          <Popconfirm
            title="Delete this account?"
            description="This will also delete the player data."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Accounts</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search username..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            value={banFilter}
            onChange={(value) => {
              setBanFilter(value);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: '0', label: 'Active' },
              { value: '1', label: 'Banned' },
            ]}
          />
        </Space>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>{selectedRowKeys.length} account(s) selected</span>
            <Popconfirm
              title={`Delete ${selectedRowKeys.length} account(s)?`}
              description="This will also delete all player data."
              onConfirm={handleBulkDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button danger loading={deleting} icon={<DeleteOutlined />}>
                Delete Selected
              </Button>
            </Popconfirm>
            <Button onClick={() => setSelectedRowKeys([])}>Clear Selection</Button>
          </Space>
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
        }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} accounts`,
        }}
        onChange={handleTableChange}
        size="small"
      />

      <Modal
        title={`Edit Account: ${editModal.account?.username}`}
        open={editModal.visible}
        onCancel={() => setEditModal({ visible: false, account: null })}
        onOk={handleSave}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="vnd" label="VND Balance">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="coin" label="Coin">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tongnap" label="Total Nạp">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_admin" label="Admin" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
