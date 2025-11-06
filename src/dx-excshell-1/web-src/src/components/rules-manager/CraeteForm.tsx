import React, { useCallback, useEffect, useState } from "react";

import {
  View,
  Heading,
  Text,
  Flex,
  TextField,
  TextArea,
  ComboBox,
  Item,
  Switch,
  NumberField,
  ListView,
  SearchField,
  ProgressCircle,
  Image,
  ActionButton,
  Form,
  Section,
} from "@adobe/react-spectrum";
import { CreateRuleBuilder } from "./create-rule/CreateRuleBuilder";
import {
  useBrandsList,
  useIsBrandListFetched,
} from "../../store/BrandSlice/selectores";
import { fetchBrandList } from "../../store/BrandSlice/asyncThunks/fetchBrandList";
import { useDispatch } from "react-redux";
import {
  useIsEventsListFetched,
  useEventsListMap,
} from "../../store/EventsSlice/selectores";
import { fetchEventsList } from "../../store/EventsSlice/asyncThunks/fetchEventsList";
import { RuleGroupType } from "react-querybuilder";
import {
  RuleDirection,
  Rule,
} from "../../../../../actions/classes/RulesManger/types";
import { Brand } from "../../../../../actions/classes/Brand";
import { validationOfFormData } from "./helpers/validationOfFormData";
import {
  IAppEventDefinition,
  IProductEventDefinition,
} from "../../../../../shared/types";

const initialFormData = {
  name: "",
  description: "",
  eventType: "",
  direction: RuleDirection.EMIT,
  targetBrands: [],
  conditions: {
    combinator: "and",
    rules: [],
  },
  actions: [],
  enabled: true,
  priority: 10,
};

const directionOptions = [
  { label: "Emit", value: RuleDirection.EMIT },
  { label: "Consume", value: RuleDirection.CONSUME },
];

export const CreateForm = () => {
  const [formData, setFormData] = useState<Partial<Rule>>(initialFormData);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchBrandName, setSearchBrandName] = useState("");

  const dispatch = useDispatch();
  const brands = useBrandsList();
  const eventsListMap = useEventsListMap();
  const isBrandListFetched = useIsBrandListFetched();
  const isEventsListFetched = useIsEventsListFetched();

  const isBrandLoading = !isBrandListFetched;

  const onQueryChange = useCallback(
    (query: RuleGroupType) => {
      setFormData((prev) => ({ ...prev, conditions: query }));
    },
    [setFormData]
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const validationError = validationOfFormData(formData);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      setErrorMessage("");

      //  TODO: Implement the API call to create the rule

      new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve("Rule created successfully with name: " + formData.name);
        }, 1000);
      }).then((message) => {
        alert(message);
      });
    },
    [formData]
  );

  useEffect(() => {
    if (!isBrandListFetched) {
      dispatch(fetchBrandList() as any);
    }

    if (!isEventsListFetched) {
      dispatch(fetchEventsList() as any);
    }
  }, [isBrandListFetched, isEventsListFetched, dispatch]);

  useEffect(() => {
    if (searchBrandName.trim() === "") {
      setFilteredBrands(brands);
      return;
    }

    const filteredBrands = brands.filter((brand) =>
      brand.name.toLowerCase().includes(searchBrandName.toLowerCase())
    );
    setFilteredBrands(filteredBrands);
  }, [searchBrandName, brands]);

  return (
    <View
      backgroundColor="gray-50"
      padding="size-300"
      borderRadius="medium"
      marginBottom="size-300"
    >
      <Heading level={3}>Create New Rule</Heading>
      <Text marginBottom="size-200">
        Fill in the details below to create a new event routing rule
      </Text>

      <Form onSubmit={onSubmit} validationBehavior="native">
        <TextField
          label="Rule Name"
          value={formData.name}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, name: value }))
          }
          isRequired
          errorMessage={"The Rule Name is required"}
          name="name"
          width="size-4000"
          placeholder="Enter a descriptive name for this rule"
        />
        <TextArea
          label="Description"
          name="description"
          value={formData.description || ""}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, description: value }))
          }
          width="size-4000"
          placeholder="Describe what this rule does"
        />
        <ComboBox
          label="Event Type"
          selectedKey={formData.eventType || ""}
          onSelectionChange={(value) =>
            setFormData((prev) => ({ ...prev, eventType: value as string }))
          }
          isRequired
          name="eventType"
          errorMessage={"The Event Type is required"}
          width="size-4000"
          placeholder="Select the event type this rule will handle"
          items={eventsListMap}
        >
          {(item) => (
            // TO DO : Find a better way to fix this type error
            // This is a workaround to fix the type error because the items is an array of IAppEventDefinition | IProductEventDefinition
            // @ts-ignore 
            <Section key={item.category} items={item.list} title={item.category}>
             {(e)=>(
              <Item key={e.code} textValue={e.name}>
                <Text>
                  {e.name}
                </Text>
              </Item>
             )}
            </Section>
          )}
        </ComboBox>
        <ComboBox
          label="Direction"
          defaultSelectedKey={formData.direction}
          onSelectionChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              direction: value as RuleDirection,
            }))
          }
          isRequired
          errorMessage={"The Direction is required"}
          name="direction"
          items={directionOptions}
          width="size-2000"
        >
          {(item) => <Item key={item.value}>{item.label}</Item>}
        </ComboBox>
        <View>
          <Text>Target Brands:</Text>
          <Text marginBottom="size-100">
            Select which brands this rule applies to. Leave all unchecked for a
            global rule.
          </Text>
          <Flex direction="column" gap="size-100" marginTop="size-100">
            <SearchField
              label="Search Brands"
              placeholder="Search by name"
              value={searchBrandName}
              onChange={(value) => setSearchBrandName(value)}
              width="size-6000"
            />

            {isBrandLoading ? (
              <Flex
                justifyContent="start"
                alignItems="center"
                height="size-2000"
              >
                <ProgressCircle aria-label="Loading brands" />
                <Text marginStart="size-100">Loading brands...</Text>
              </Flex>
            ) : (
              <ListView
                maxWidth="size-6000"
                maxHeight="size-6000"
                aria-label="ListView with controlled selection"
                selectionMode="multiple"
                items={filteredBrands}
                defaultSelectedKeys={new Set(formData.targetBrands || [])}
                onSelectionChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetBrands: Array.from(value as Set<string>),
                  }))
                }
              >
                {(item: Brand) => (
                  <Item key={item.brandId}>
                    {item.logo && (
                      <Image
                        width="size-400"
                        height="size-400"
                        src={item.logo}
                        alt={item.name}
                      />
                    )}
                    <Text>{item.name}</Text>
                  </Item>
                )}
              </ListView>
            )}
          </Flex>
        </View>
        <NumberField
          label="Priority"
          name="priority"
          value={formData.priority || 10}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, priority: value }))
          }
          minValue={1}
          maxValue={100}
          width="size-1000"
          description="Lower numbers have higher priority"
          errorMessage={"The Priority is required"}
        />
        <Switch
          name="enabled"
          isSelected={formData.enabled}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, enabled: value }))
          }
        >
          Enabled
        </Switch>
        <Flex gap="size-300" marginTop="size-300">
          <ActionButton type="submit" onPress={() => {}}>
            Save Rule
          </ActionButton>
        </Flex>
        {errorMessage && (
          <Text
            marginTop="size-300"
            UNSAFE_style={{ color: "var(--spectrum-red-800)" }}
          >
            {errorMessage}
          </Text>
        )}
      </Form>

      <CreateRuleBuilder onQueryChange={onQueryChange} />
    </View>
  );
};
