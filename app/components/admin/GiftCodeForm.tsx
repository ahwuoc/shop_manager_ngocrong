'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, Row, Col, Space, message, Radio, Collapse, Divider } from 'antd';
import { ReloadOutlined, PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface ItemTemplate {
  id: number;
  NAME: string;
  TYPE: number;
  description: string;
}

interface ItemOption {
  id: number;
  NAME: string | null;
  TYPE: number;
}

interface GiftItemOption {
  id: number;
  param: number;
}

interface GiftItem {
  id: number;
  quantity: number;
  options: GiftItemOption[];
}

interface GiftCodeFormProps {
  initialData?: {
    code?: string;
    type?: number;
    gold?: number;
    gem?: number;
    ruby?: number;
    items?: string;
    status?: number;
    expires_at?: string;
  };
  giftCodeId?: string;
  mode: 'create' | 'edit';
}

export default function GiftCodeForm({ initialData, giftCodeId, mode }: GiftCodeFormProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [itemOptions, setItemOptions] = useState<ItemTemplate[]>([]);
  const [allItemOptions, setAllItemOptions] = useState<ItemOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<GiftItem[]>([]);
  const [itemNames, setItemNames] = useState<Map<number, string>>(new Map());

  // Fetch all item option templates on mount
  useEffect(() => {
    fetch('/api/admin/item-options')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAllItemOptions(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // Parse initial items
  useEffect(() => {
    if (initialData?.items) {
      try {
        const items: GiftItem[] = JSON.parse(initialData.items);
        // Ensure each item has options array
        const normalizedItems = items.map(item => ({
          ...item,
          options: item.options || [],
        }));
        setSelectedItems(normalizedItems);
        
        // Fetch names for initial items
        const ids = items.map(i => i.id);
        if (ids.length > 0) {
          fetch(`/api/admin/item-templates?ids=${ids.join(',')}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                const names = new Map<number, string>();
                data.data.forEach((item: ItemTemplate) => names.set(item.id, item.NAME));
                setItemNames(names);
              }
            });
        }
      } catch {
        // Invalid JSON
      }
    }
  }, [initialData?.items]);


  const searchItems = async (search: string) => {
    if (!search || search.length < 2) {
      setItemOptions([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/item-templates?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      if (data.success) {
        setItemOptions(data.data);
      }
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addItem = () => {
    setSelectedItems(prev => [...prev, { id: 0, quantity: 1, options: [] }]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof GiftItem, value: number | GiftItemOption[]) => {
    setSelectedItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const selectItem = (index: number, itemId: number) => {
    const item = itemOptions.find(i => i.id === itemId);
    if (item) {
      setItemNames(prev => new Map(prev).set(itemId, item.NAME));
    }
    updateItem(index, 'id', itemId);
  };

  const addOption = (itemIndex: number) => {
    const item = selectedItems[itemIndex];
    const newOptions = [...item.options, { id: 0, param: 0 }];
    updateItem(itemIndex, 'options', newOptions);
  };

  const removeOption = (itemIndex: number, optionIndex: number) => {
    const item = selectedItems[itemIndex];
    const newOptions = item.options.filter((_, i) => i !== optionIndex);
    updateItem(itemIndex, 'options', newOptions);
  };

  const updateOption = (itemIndex: number, optionIndex: number, field: 'id' | 'param', value: number) => {
    const item = selectedItems[itemIndex];
    const newOptions = item.options.map((opt, i) => {
      if (i !== optionIndex) return opt;
      return { ...opt, [field]: value };
    });
    updateItem(itemIndex, 'options', newOptions);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setFieldValue('code', code);
  };

  const handleSubmit = async (values: { code: string; type: number; gold: number; gem: number; ruby: number; status: number; expires_at: dayjs.Dayjs | null }) => {
    // Filter out items with id = 0
    const validItems = selectedItems.filter(item => item.id > 0);
    const itemsJson = validItems.length > 0 ? JSON.stringify(validItems) : null;
    
    // Validate rewards
    const hasReward = values.gold > 0 || values.gem > 0 || values.ruby > 0 || validItems.length > 0;
    if (!hasReward) {
      message.error('At least one reward must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'create' ? '/api/admin/gift-codes' : `/api/admin/gift-codes/${giftCodeId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          items: itemsJson,
          expires_at: values.expires_at ? values.expires_at.toISOString() : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(mode === 'create' ? 'Gift code created successfully' : 'Gift code updated successfully');
        router.push('/admin/gift-codes');
      } else {
        message.error(data.message || 'Failed to save gift code');
      }
    } catch (error) {
      console.error('Error saving gift code:', error);
      message.error('Failed to save gift code');
    } finally {
      setLoading(false);
    }
  };

  const getOptionName = (optionId: number) => {
    const opt = allItemOptions.find(o => o.id === optionId);
    return opt?.NAME || `Option #${optionId}`;
  };


  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        code: initialData?.code || '',
        type: initialData?.type ?? 0,
        gold: initialData?.gold ?? 0,
        gem: initialData?.gem ?? 0,
        ruby: initialData?.ruby ?? 0,
        status: initialData?.status ?? 0, // 0 = unused (default for new codes)
        expires_at: initialData?.expires_at ? dayjs(initialData.expires_at) : null,
      }}
    >
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item
            name="code"
            label="Gift Code"
            rules={[
              { required: true, message: 'Code is required' },
              { min: 6, message: 'Code must be at least 6 characters' },
              { max: 20, message: 'Code must be at most 20 characters' },
              { pattern: /^[A-Za-z0-9]+$/, message: 'Code must be alphanumeric only' },
            ]}
          >
            <Input
              placeholder="Enter code or generate"
              style={{ textTransform: 'uppercase' }}
              addonAfter={
                <Button type="text" icon={<ReloadOutlined />} onClick={generateCode} size="small">
                  Generate
                </Button>
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="type" label="Type" tooltip="Single-use: Only 1 user can use. Multi-use: Many users can use (each user once).">
            <Select
              options={[
                { value: 0, label: 'Single-use (1 user only)' },
                { value: 1, label: 'Multi-use (many users, each once)' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Card title="Currency Rewards" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="gold" label="Gold">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="gem" label="Gem">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="ruby" label="Ruby">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card 
        title="Item Rewards" 
        size="small" 
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={addItem} size="small">
            Add Item
          </Button>
        }
      >
        {selectedItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>
            No items added. Click &quot;Add Item&quot; to add rewards.
          </div>
        ) : (
          <Collapse accordion>
            {selectedItems.map((item, itemIndex) => (
              <Collapse.Panel
                key={itemIndex}
                header={
                  <Space>
                    <span>{item.id > 0 ? (itemNames.get(item.id) || `Item #${item.id}`) : 'New Item'}</span>
                    <span style={{ color: '#999' }}>x{item.quantity}</span>
                    {item.options.length > 0 && (
                      <span style={{ color: '#1890ff' }}>({item.options.length} options)</span>
                    )}
                  </Space>
                }
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => { e.stopPropagation(); removeItem(itemIndex); }}
                    size="small"
                  />
                }
              >
                <Row gutter={16}>
                  <Col xs={24} md={16}>
                    <div style={{ marginBottom: 8 }}>Item</div>
                    <Select
                      showSearch
                      placeholder="Search items by name..."
                      filterOption={false}
                      onSearch={searchItems}
                      onChange={(val) => selectItem(itemIndex, val)}
                      loading={searchLoading}
                      style={{ width: '100%' }}
                      value={item.id > 0 ? item.id : undefined}
                      options={itemOptions.map(opt => ({
                        value: opt.id,
                        label: `${opt.NAME} (ID: ${opt.id})`,
                      }))}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ marginBottom: 8 }}>Quantity</div>
                    <InputNumber
                      min={1}
                      value={item.quantity}
                      onChange={(val) => updateItem(itemIndex, 'quantity', val || 1)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>

                <Divider style={{ margin: '16px 0 8px' }}>
                  <Space>
                    <SettingOutlined />
                    Options
                    <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => addOption(itemIndex)}>
                      Add
                    </Button>
                  </Space>
                </Divider>

                {item.options.length === 0 ? (
                  <div style={{ color: '#999', fontSize: 12 }}>No options. Click &quot;Add&quot; to add item options.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {item.options.map((opt, optIndex) => (
                      <Row key={optIndex} gutter={8} align="middle">
                        <Col flex="1">
                          <Select
                            placeholder="Select option"
                            value={opt.id > 0 ? opt.id : undefined}
                            onChange={(val) => updateOption(itemIndex, optIndex, 'id', val)}
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
                            onChange={(val) => updateOption(itemIndex, optIndex, 'param', val || 0)}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeOption(itemIndex, optIndex)}
                            size="small"
                          />
                        </Col>
                      </Row>
                    ))}
                  </div>
                )}
              </Collapse.Panel>
            ))}
          </Collapse>
        )}
      </Card>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item name="expires_at" label="Expiry Date (optional)">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Col>
      </Row>
      
      {/* Hidden status field - defaults to 0 (unused) for new codes */}
      <Form.Item name="status" hidden>
        <Input />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === 'create' ? 'Create Gift Code' : 'Update Gift Code'}
          </Button>
          <Button onClick={() => router.push('/admin/gift-codes')}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
