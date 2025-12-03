'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { Table, Button, Input, Space, Tag, Popconfirm, message, Card, Switch, Breadcrumb } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

interface ShopItem {
  id: number;
  tab_id: number;
  temp_id: number;
  gold: number;
  gem: number;
  is_new: boolean;
  is_sell: boolean;
  item_exchange: number;
  quantity_exchange: number;
  options: { option_id: number; param: number }[];
}

interface Tab {
  id: number;
  NAME: string;
}

interface ItemTemplate {
  id: number;
  NAME: string;
}

export default function ShopTabPage({ params }: { params: Promise<{ tabId: string }> }) {
  const resolvedParams = use(params);
  const tabId = parseInt(resolvedParams.tabId);
  
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [tab, setTab] = useState<Tab | null>(null);
  const [itemNames, setItemNames] = useState<Map<number, string>>(new Map());
  const fetchedItemIds = useRef<Set<number>>(new Set());

  // Fetch tab info
  useEffect(() => {
    fetch('/api/admin/tabs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const foundTab = data.data.find((t: Tab) => t.id === tabId);
          setTab(foundTab || null);
        }
      })
      .catch(console.error);
  }, [tabId]);

  const fetchShopItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
        tabId: tabId.toString(),
      });

      const response = await fetch(`/api/admin/shop?${params}`);
      const data = await response.json();

      if (data.success) {
        setShopItems(data.data.items);
        setPagination(prev => ({ ...prev, total: data.data.total }));
      }
    } catch (error) {
      console.error('Error fetching shop items:', error);
      message.error('Failed to fetch shop items');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, search, tabId]);

  useEffect(() => {
    fetchShopItems();
  }, [fetchShopItems]);

  // Fetch item names
  useEffect(() => {
    const fetchItemNames = async () => {
      const allItemIds = new Set<number>();
      shopItems.forEach(item => {
        allItemIds.add(item.temp_id);
        if (item.item_exchange > 0) allItemIds.add(item.item_exchange);
      });

      const newIds = Array.from(allItemIds).filter(id => !fetchedItemIds.current.has(id));
      if (newIds.length === 0) return;

      try {
        const response = await fetch(`/api/admin/item-templates?ids=${newIds.join(',')}`);
        const data = await response.json();
        if (data.success) {
          const newMap = new Map(itemNames);
          data.data.forEach((item: ItemTemplate) => {
            newMap.set(item.id, item.NAME);
            fetchedItemIds.current.add(item.id);
          });
          setItemNames(newMap);
        }
      } catch (error) {
        console.error('Error fetching item names:', error);
      }
    };

    if (shopItems.length > 0) fetchItemNames();
  }, [shopItems, itemNames]);


  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/shop/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        message.success('Deleted');
        fetchShopItems();
      } else {
        message.error(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      message.error('Failed to delete');
    }
  };

  const handleToggleSell = async (id: number, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/shop/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sell: !currentValue }),
      });
      const data = await response.json();
      if (data.success) {
        message.success('Updated');
        fetchShopItems();
      }
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    }));
  };

  const columns: ColumnsType<ShopItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Item',
      dataIndex: 'temp_id',
      key: 'item',
      render: (tempId: number) => (
        <span>{itemNames.get(tempId) || `Item #${tempId}`}</span>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.gold > 0 && <span style={{ color: '#faad14' }}>{record.gold.toLocaleString()} Gold</span>}
          {record.gem > 0 && <span style={{ color: '#1890ff' }}>{record.gem.toLocaleString()} Gem</span>}
        </Space>
      ),
    },
    {
      title: 'Options',
      key: 'options',
      width: 80,
      render: (_, record) => record.options?.length > 0 ? (
        <Tag color="blue">{record.options.length} opts</Tag>
      ) : '-',
    },
    {
      title: 'New',
      dataIndex: 'is_new',
      key: 'is_new',
      width: 70,
      render: (isNew: boolean) => isNew ? <Tag color="green">NEW</Tag> : '-',
    },
    {
      title: 'On Sale',
      dataIndex: 'is_sell',
      key: 'is_sell',
      width: 80,
      render: (isSell: boolean, record) => (
        <Switch checked={isSell} onChange={() => handleToggleSell(record.id, isSell)} size="small" />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Link href={`/admin/shop/${record.id}/edit`}>
            <Button size="small" icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Delete?"
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
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link href="/admin"><HomeOutlined /> Dashboard</Link> },
          { title: <Link href="/admin/shop"><ShoppingOutlined /> Shop</Link> },
          { title: tab?.NAME || `Tab ${tabId}` },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{tab?.NAME || 'Shop Items'}</h2>
        <Link href={`/admin/shop/new?tabId=${tabId}`}>
          <Button type="primary" icon={<PlusOutlined />}>Add Item</Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by item ID..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination(prev => ({ ...prev, current: 1 }));
          }}
          style={{ width: 250 }}
          allowClear
        />
      </Card>

      <Table
        columns={columns}
        dataSource={shopItems}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        onChange={handleTableChange}
        size="small"
      />
    </div>
  );
}
