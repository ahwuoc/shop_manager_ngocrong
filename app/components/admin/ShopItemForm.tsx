'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, InputNumber, Select, Button, Card, Row, Col, Space, message, Switch, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';

interface Tab {
  id: number;
  NAME: string;
}

interface ItemTemplate {
  id: number;
  NAME: string;
}

interface ItemOption {
  id: number;
  NAME: string | null;
  TYPE: number;
}

interface ShopOption {
  option_id: number;
  param: number;
}

interface ShopItemFormProps {
  initialData?: {
    tab_id?: number;
    temp_id?: number;
    gold?: number;
    gem?: number;
    is_new?: boolean;
    is_sell?: boolean;
    item_exchange?: number;
    quantity_exchange?: number;
    options?: { option_id: number; param: number }[];
  };
  shopItemId?: string;
  mode: 'create' | 'edit';
}

export default function ShopItemForm({ initialData, shopItemId, mode }: ShopItemFormProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemTemplate[]>([]);
  const [allItemOptions, setAllItemOptions] = useState<ItemOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [exchangeItemName, setExchangeItemName] = useState<string>('');
  const [shopOptions, setShopOptions] = useState<ShopOption[]>([]);

  // Fetch tabs and item options
  useEffect(() => {
    fetch('/api/admin/tabs')
      .then(res => res.json())
      .then(data => {
        if (data.success) setTabs(data.data);
      })
      .catch(console.error);

    fetch('/api/admin/item-options')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAllItemOptions(data.data);
      })
      .catch(console.error);
  }, []);

  // Initialize options from initialData
  useEffect(() => {
    if (initialData?.options) {
      setShopOptions(initialData.options.map(opt => ({
        option_id: opt.option_id,
        param: opt.param,
      })));
    }
  }, [initialData?.options]);

  // Fetch initial item names
  useEffect(() => {
    const ids = [];
    if (initialData?.temp_id) ids.push(initialData.temp_id);
    if (initialData?.item_exchange && initialData.item_exchange > 0) ids.push(initialData.item_exchange);
    
    if (ids.length > 0) {
      fetch(`/api/admin/item-templates?ids=${ids.join(',')}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            data.data.forEach((item: ItemTemplate) => {
              if (item.id === initialData?.temp_id) setSelectedItemName(item.NAME);
              if (item.id === initialData?.item_exchange) setExchangeItemName(item.NAME);
            });
          }
        });
    }
  }, [initialData]);

  const searchItems = async (search: string) => {
    if (!search || search.length < 2) {
      setItemOptions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/item-templates?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      if (data.success) setItemOptions(data.data);
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addOption = () => {
    setShopOptions(prev => [...prev, { option_id: 0, param: 0 }]);
  };

  const removeOption = (index: number) => {
    setShopOptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'option_id' | 'param', value: number) => {
    setShopOptions(prev => prev.map((opt, i) => {
      if (i !== index) return opt;
      return { ...opt, [field]: value };
    }));
  };


  const handleSubmit = async (values: {
    tab_id: number;
    temp_id: number;
    gold: number;
    gem: number;
    is_new: boolean;
    is_sell: boolean;
    item_exchange: number;
    quantity_exchange: number;
  }) => {
    // Filter valid options
    const validOptions = shopOptions.filter(opt => opt.option_id > 0);

    setLoading(true);
    try {
      const url = mode === 'create' ? '/api/admin/shop' : `/api/admin/shop/${shopItemId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          options: validOptions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(mode === 'create' ? 'Shop item created' : 'Shop item updated');
        router.push('/admin/shop');
      } else {
        message.error(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      message.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        tab_id: initialData?.tab_id,
        temp_id: initialData?.temp_id,
        gold: initialData?.gold ?? 0,
        gem: initialData?.gem ?? 0,
        is_new: initialData?.is_new ?? true,
        is_sell: initialData?.is_sell ?? true,
        item_exchange: initialData?.item_exchange ?? -1,
        quantity_exchange: initialData?.quantity_exchange ?? 0,
      }}
    >
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item name="tab_id" label="Tab" rules={[{ required: true, message: 'Tab is required' }]}>
            <Select
              placeholder="Select tab"
              options={tabs.map(t => ({ value: t.id, label: t.NAME }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="temp_id" label="Item" rules={[{ required: true, message: 'Item is required' }]}>
            <Select
              showSearch
              placeholder="Search item by name or ID..."
              filterOption={false}
              onSearch={searchItems}
              loading={searchLoading}
              onChange={(val) => {
                const item = itemOptions.find(i => i.id === val);
                if (item) setSelectedItemName(item.NAME);
              }}
              options={[
                ...(selectedItemName && initialData?.temp_id ? [{ value: initialData.temp_id, label: `${selectedItemName} (ID: ${initialData.temp_id})` }] : []),
                ...itemOptions.filter(i => i.id !== initialData?.temp_id).map(item => ({
                  value: item.id,
                  label: `${item.NAME} (ID: ${item.id})`,
                })),
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Card title="Pricing" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="gold" label="Gold Price">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="gem" label="Gem Price">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card 
        title={<><SettingOutlined /> Item Options</>}
        size="small" 
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addOption}>
            Add Option
          </Button>
        }
      >
        {shopOptions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>
            No options. Click &quot;Add Option&quot; to add item stats.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shopOptions.map((opt, index) => (
              <Row key={index} gutter={8} align="middle">
                <Col flex="1">
                  <Select
                    placeholder="Select option"
                    value={opt.option_id > 0 ? opt.option_id : undefined}
                    onChange={(val) => updateOption(index, 'option_id', val)}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="label"
                    options={allItemOptions.map(o => ({
                      value: o.id,
                      label: `${o.NAME || 'Unknown'} (ID: ${o.id})`,
                    }))}
                  />
                </Col>
                <Col flex="120px">
                  <InputNumber
                    placeholder="Param"
                    value={opt.param}
                    onChange={(val) => updateOption(index, 'param', val || 0)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeOption(index)}
                    size="small"
                  />
                </Col>
              </Row>
            ))}
          </div>
        )}
      </Card>

      <Card title="Exchange (Optional)" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="item_exchange" label="Exchange Item">
              <Select
                showSearch
                allowClear
                placeholder="Search item..."
                filterOption={false}
                onSearch={searchItems}
                loading={searchLoading}
                onChange={(val) => {
                  if (!val) {
                    form.setFieldValue('item_exchange', -1);
                    setExchangeItemName('');
                  } else {
                    const item = itemOptions.find(i => i.id === val);
                    if (item) setExchangeItemName(item.NAME);
                  }
                }}
                options={[
                  ...(exchangeItemName && initialData?.item_exchange && initialData.item_exchange > 0 
                    ? [{ value: initialData.item_exchange, label: `${exchangeItemName} (ID: ${initialData.item_exchange})` }] 
                    : []),
                  ...itemOptions.filter(i => i.id !== initialData?.item_exchange).map(item => ({
                    value: item.id,
                    label: `${item.NAME} (ID: ${item.id})`,
                  })),
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="quantity_exchange" label="Quantity">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        <Col xs={12}>
          <Form.Item name="is_new" label="Show NEW badge" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={12}>
          <Form.Item name="is_sell" label="Available for sale" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === 'create' ? 'Create Shop Item' : 'Update Shop Item'}
          </Button>
          <Button onClick={() => router.push('/admin/shop')}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
