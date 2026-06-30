import React from 'react';
import { useProgress } from '../context/ProgressContext';
import RewardModal from './RewardModal';
import LevelUpModal from './LevelUpModal';
import AchievementDetailModal from './AchievementDetailModal';

/**
 * GlobalModals component keeps context files clean by managing the rendering of 
 * all globally accessible overlay/modal UI components.
 */
export default function GlobalModals() {
  const { 
    showRewardModal, setShowRewardModal, rewardConfig,
    showLevelUpModal, setShowLevelUpModal, levelUpData,
    showAchievementModal, setShowAchievementModal, selectedAchievement
  } = useProgress();

  return (
    <>
      <RewardModal 
        visible={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        xp={rewardConfig?.xp}
        title={rewardConfig?.title}
        subTitle={rewardConfig?.subTitle}
        type={rewardConfig?.type}
        onAction={rewardConfig?.onAction}
      />
      
      <LevelUpModal
        visible={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        levelData={levelUpData}
      />
      
      <AchievementDetailModal 
        visible={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        achievement={selectedAchievement}
      />
    </>
  );
}
