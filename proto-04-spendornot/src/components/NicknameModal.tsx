import { useState } from 'react';
import { Button, Paragraph, TextField } from '@toss/tds-mobile';
import { useAppStore } from '../store/useAppStore';
import { MAX_NICKNAME_LENGTH } from '../types';
import './NicknameModal.css';

type NicknameModalMode = 'initial' | 'edit';

interface NicknameModalProps {
  mode?: NicknameModalMode;
  initialValue?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function NicknameModal({
  mode = 'initial',
  initialValue = '',
  onComplete,
  onCancel,
}: NicknameModalProps) {
  const setUserName = useAppStore((s) => s.setUserName);
  const [nickname, setNickname] = useState(initialValue.slice(0, MAX_NICKNAME_LENGTH));

  const isEditMode = mode === 'edit';

  const handleChange = (value: string) => {
    if (value.length <= MAX_NICKNAME_LENGTH) {
      setNickname(value);
    }
  };

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    onComplete();
  };

  return (
    <div className="nickname-overlay">
      <div className="nickname-modal" role="dialog" aria-modal="true" aria-labelledby="nickname-title">
        <Paragraph.Text typography="t3" fontWeight="bold" id="nickname-title">
          별명
        </Paragraph.Text>
        <Paragraph.Text typography="t6" color="adaptive-grey-600" className="nickname-modal__desc">
          {isEditMode
            ? '변경한 별명은 메인 화면과 통계에 바로 반영돼요.'
            : '별명은 필수예요. 메인 화면과 통계에서 사용돼요.'}
        </Paragraph.Text>

        <div className="nickname-modal__field">
          <TextField
            variant="box"
            placeholder="별명 입력"
            value={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            onChange={(event) => handleChange(event.target.value)}
            autoFocus
          />
          <Paragraph.Text typography="t7" color="adaptive-grey-600" className="nickname-modal__counter">
            {nickname.length}/{MAX_NICKNAME_LENGTH}
          </Paragraph.Text>
        </div>

        <div className="nickname-modal__actions">
          <Button size="xlarge" variant="weak" color="dark" display="full" onClick={onCancel}>
            취소
          </Button>
          <Button
            size="xlarge"
            color="primary"
            display="full"
            onClick={handleSave}
            disabled={!nickname.trim()}
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
