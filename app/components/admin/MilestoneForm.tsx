'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, InputNumber, Button, Card, Row, Col, Space, message, Select, Collapse, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';

interface ItemTemplate {
  id: number;
  NAME: string;
}

interface ItemOption {
  id: number;
  NAME: string | null;
}

interface RewardItemOption {
  item_option_id: number;
  item_option_param: number;
}

interface RewardItem {
  item_id: number;
  item_quantity: number;
  item_options: RewardItemOption[];
}

interface MilestoneFormProps {
  initialData?: {
    required?: number;
    descriptor?: string;
    rewards?: RewardItem[];
  };
  milestoneId?: string;
  mode: 'create' | 'edit';
}

export default function MilestoneForm({ initialData, milestoneId, mode }: MilestoneFormProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [itemOptions, setItemOptions] = useState<ItemTemplate[]>([]);
  const [allItemOptions, setAllItemOptions] = useState<ItemOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [itemNames, setItemNames] = useState<Map<number, string>>(new Map());

  // Fetch item options
  useEffect(() => {
    fetch('/api/admin/item-options')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAllItemOptions(data.data);
      })
      .catch(console.error);
  }, []);

  // Initialize rewards
  useEffect(() => {
    if (initialData?.rewards) {
      setRewards(initialData.rewards);
      // Fetch item names
      const ids = initialData.rewards.map(r => r.item_id);
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
    }
  }, [initialData?.rewards]);

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

  const addReward = () => {
    setRewards(prev => [...prev, { item_id: 0, item_quantity: 1, item_options: [] }]);
  };

  const removeReward = (index: number) => {
    setRewards(prev => prev.filter((_, i) => i !== index));
  };

  const updateReward = (index: number, field: keyof RewardItem, value: number | RewardItemOption[]) => {
    setRewards(prev => prev.map((r, i) => {
      if (i !== index) return r;
      return { ...r, [field]: value };
    }));
  };

  const selectItem = (index: number, itemId: number) => {
    const item = itemOptions.find(i => i.id === itemId);
    if (item) {
      setItemNames(prev => new Map(prev).set(itemId, item.NAME));
    }
    updateReward(index, 'item_id', itemId);
  };

  const addOption = (rewardIndex: number) => {
    const reward = rewards[rewardIndex];
    const newOptions = [...reward.item_options, { item_option_id: 0, item_option_param: 0 }];
    updateReward(rewardIndex, 'item_options', newOptions);
  };

  const removeOption = (rewardIndex: number, optionIndex: number) => {
    const reward = rewards[rewardIndex];
    const newOptions = reward.item_options.filter((_, i) => i !== optionIndex);
    updateReward(rewardIndex, 'item_options', newOptions);
  };

  const updateOption = (rewardIndex: number, optionIndex: number, field: 'item_option_id' | 'item_option_param', value: number) => {
    const reward = rewards[rewardIndex];
    const newOptions = reward.item_options.map((opt, i) => {
      if (i !== optionIndex) return opt;
      return { ...opt, [field]: value };
    });
    updateReward(rewardIndex, 'item_options', newOptions);
  };


  const handleSubmit = async (values: { required: number; descriptor: string }) => {
    // Filter valid rewards
    const validRewards = rewards.filter(r => r.item_id > 0);

    if (validRewards.length === 0) {
      message.error('At least one reward is required');
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'create' ? '/api/admin/milestones' : `/api/admin/milestones/${milestoneId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          rewards: validRewards,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(mode === 'create' ? 'Milestone created' : 'Milestone updated');
        router.push('/admin/milestones');
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
        required: initialData?.required ?? 0,
        descriptor: initialData?.descriptor || '',
      }}
    >
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Form.Item
            name="required"
            label="Threshold (VND)"
            rules={[{ required: true, message: 'Threshold is required' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="descriptor" label="Description">
            <Input placeholder="e.g., Mốc 100K" />
          </Form.Item>
        </Col>
      </Row>

      <Card
        title="Rewards"
        size="small"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addReward}>
            Add Reward
          </Button>
        }
      >
        {rewards.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>
            No rewards. Click &quot;Add Reward&quot; to add items.
          </div>
        ) : (
          <Collapse accordion>
            {rewards.map((reward, rewardIndex) => (
              <Collapse.Panel
                key={rewardIndex}
                header={
                  <Space>
                    <span>{reward.item_id > 0 ? (itemNames.get(reward.item_id) || `Item #${reward.item_id}`) : 'New Reward'}</span>
                    <span style={{ color: '#999' }}>x{reward.item_quantity}</span>
                    {reward.item_options.length > 0 && (
                      <span style={{ color: '#1890ff' }}>({reward.item_options.length} options)</span>
                    )}
                  </Space>
                }
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => { e.stopPropagation(); removeReward(rewardIndex); }}
                    size="small"
                  />
                }
              >
                <Row gutter={16}>
                  <Col xs={24} md={16}>
                    <div style={{ marginBottom: 8 }}>Item</div>
                    <Select
                      showSearch
                      placeholder="Search items..."
                      filterOption={false}
                      onSearch={searchItems}
                      onChange={(val) => selectItem(rewardIndex, val)}
                      loading={searchLoading}
                      style={{ width: '100%' }}
                      value={reward.item_id > 0 ? reward.item_id : undefined}
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
                      value={reward.item_quantity}
                      onChange={(val) => updateReward(rewardIndex, 'item_quantity', val || 1)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>

                <Divider style={{ margin: '16px 0 8px' }}>
                  <Space>
                    <SettingOutlined />
                    Options
                    <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => addOption(rewardIndex)}>
                      Add
                    </Button>
                  </Space>
                </Divider>

                {reward.item_options.length === 0 ? (
                  <div style={{ color: '#999', fontSize: 12 }}>No options.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reward.item_options.map((opt, optIndex) => (
                      <Row key={optIndex} gutter={8} align="middle">
                        <Col flex="1">
                          <Select
                            placeholder="Select option"
                            value={opt.item_option_id > 0 ? opt.item_option_id : undefined}
                            onChange={(val) => updateOption(rewardIndex, optIndex, 'item_option_id', val)}
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
                            value={opt.item_option_param}
                            onChange={(val) => updateOption(rewardIndex, optIndex, 'item_option_param', val || 0)}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeOption(rewardIndex, optIndex)}
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

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === 'create' ? 'Create Milestone' : 'Update Milestone'}
          </Button>
          <Button onClick={() => router.push('/admin/milestones')}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
