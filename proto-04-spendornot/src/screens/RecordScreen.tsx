import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Chip,
  ChipItem,
  ListRow,
  Paragraph,
  TextArea,
  TextField,
} from '@toss/tds-mobile';
import ScreenHeader from '../components/ScreenHeader';
import { useAppStore } from '../store/useAppStore';
import type { Category } from '../types';
import { CATEGORIES, MAX_MEMO_LENGTH, categoryHasMemo } from '../types';
import { formatAmount, formatRecordDateTitle, getTodayString } from '../utils/format';
import './RecordScreen.css';

export default function RecordScreen() {
  const navigate = useNavigate();
  const addRecord = useAppStore((s) => s.addRecord);
  const deleteRecord = useAppStore((s) => s.deleteRecord);
  const records = useAppStore((s) => s.records);

  const today = getTodayString();
  const todayRecords = records.filter((record) => record.date === today);

  const [category, setCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const showMemoInput = categoryHasMemo(category);

  const close = () => navigate(-1);

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    if (!categoryHasMemo(cat)) {
      setMemo('');
    }
  };

  const handleSave = () => {
    const parsedAmount = Number(amount.replace(/,/g, ''));
    if (!category || !amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    const memoValue = categoryHasMemo(category) ? memo.trim() : undefined;
    addRecord(today, category, parsedAmount, memoValue);
    setCategory(null);
    setAmount('');
    setMemo('');
  };

  const parsedAmount = Number(amount.replace(/,/g, ''));
  const canSave =
    category !== null &&
    amount.length > 0 &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0;

  const handleAmountChange = (value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    setAmount(digits);
  };

  const handleMemoChange = (value: string) => {
    if (value.length <= MAX_MEMO_LENGTH) {
      setMemo(value);
    }
  };

  return (
    <div className="screen record-screen screen-with-bottom-footer">
      <ScreenHeader title={formatRecordDateTitle(today)} onBack={close} />

      <main className="record-screen__body screen-with-bottom-footer__body">
        <section className="record-screen__section">
          <Paragraph.Text typography="t6" fontWeight="semibold" color="adaptive-grey-600">
            카테고리
          </Paragraph.Text>
          <Chip kind="select" className="record-screen__chips">
            {CATEGORIES.map((cat) => (
              <ChipItem
                key={cat}
                as="button"
                type="button"
                selected={category === cat}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </ChipItem>
            ))}
          </Chip>
        </section>

        <section className="record-screen__section">
          <TextField
            variant="box"
            inputMode="numeric"
            placeholder="0"
            suffix="원"
            value={amount ? Number(amount).toLocaleString('ko-KR') : ''}
            onChange={(event) => handleAmountChange(event.target.value)}
          />
        </section>

        {showMemoInput && (
          <section className="record-screen__section">
            <TextArea
              variant="box"
              label="메모 (선택)"
              labelOption="sustain"
              placeholder="메모를 입력해 주세요"
              value={memo}
              rows={3}
              onChange={(event) => handleMemoChange(event.target.value)}
              help={`${memo.length}/${MAX_MEMO_LENGTH}`}
            />
          </section>
        )}

        {todayRecords.length > 0 && (
          <section className="record-screen__section">
            <Paragraph.Text typography="t6" fontWeight="semibold" color="adaptive-grey-600">
              오늘 기록
            </Paragraph.Text>
            <ul className="record-screen__list">
              {todayRecords.map((record) => (
                <ListRow
                  key={record.id}
                  as="li"
                  contents={
                    <ListRow.Texts
                      type="2RowTypeA"
                      top={record.category}
                      topProps={{ fontWeight: 'semibold' }}
                      bottom={`${formatAmount(record.amount)}원${record.memo ? ` · ${record.memo}` : ''}`}
                      bottomProps={{ color: 'adaptive-grey-600' }}
                    />
                  }
                  right={
                    <Button
                      size="small"
                      variant="weak"
                      color="dark"
                      onClick={() => deleteRecord(record.id)}
                    >
                      삭제
                    </Button>
                  }
                />
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="screen-bottom-footer screen-bottom-footer--bordered record-screen__footer">
        <Paragraph.Text typography="t7" color="adaptive-grey-600" className="record-screen__hint">
          기록은 오늘만 가능해요.
        </Paragraph.Text>
        <div className="screen-bottom-footer__actions record-screen__footer-actions">
          <Button size="xlarge" variant="weak" color="dark" display="full" onClick={close}>
            취소
          </Button>
          <Button
            size="xlarge"
            color="primary"
            display="full"
            disabled={!canSave}
            onClick={handleSave}
          >
            저장하기
          </Button>
        </div>
      </footer>
    </div>
  );
}
