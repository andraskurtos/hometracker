import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReceipts, useUploadReceipt } from './useReceipts';
import { useHouseholdMembers } from '../../households/hooks/useHouseholds';

export const useReceiptSplitterLogic = (householdId: string | null) => {
  const { t } = useTranslation();
  
  // Data Queries
  const { 
    data: serverReceipts = [], 
    isLoading: isLoadingReceipts, 
    refetch 
  } = useReceipts(householdId);
  
  const { data: members = [] } = useHouseholdMembers(householdId);
  const uploadMutation = useUploadReceipt(householdId);

  // UI State
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [closingReceiptIds, setClosingReceiptIds] = useState<Set<number>>(new Set());
  const [activeSplitId, setActiveSplitId] = useState<{ receiptId: number, itemId: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accordion Logic
  const toggleAccordion = (id: number) => {
    if (expandedIds.has(id)) {
      setClosingReceiptIds(new Set([id]));
      setTimeout(() => {
        setExpandedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setClosingReceiptIds(new Set());
      }, 500);
    } else {
      setExpandedIds(prev => new Set([...prev, id]));
    }
  };

  // Upload Logic
  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      setIsModalOpen(false);
    } catch (err) {
      alert(t('groceries.upload.error'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const openUploadModal = () => setIsModalOpen(true);
  const closeUploadModal = () => {
    if (!uploadMutation.isPending) {
      setIsModalOpen(false);
      setSelectedFile(null);
    }
  };

  return {
    // Data
    serverReceipts,
    members,
    isLoading: isLoadingReceipts,
    isUploading: uploadMutation.isPending,
    
    // Accordion
    expandedIds,
    closingReceiptIds,
    toggleAccordion,
    
    // Split State
    activeSplitId,
    setActiveSplitId,
    
    // Upload Modal
    isModalOpen,
    selectedFile,
    fileInputRef,
    openUploadModal,
    closeUploadModal,
    handleUpload,
    handleFileChange,
    
    // Utils
    refetch,
    t
  };
};

export type ReceiptSplitterLogic = ReturnType<typeof useReceiptSplitterLogic>;
